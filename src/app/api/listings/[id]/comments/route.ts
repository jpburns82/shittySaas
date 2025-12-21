import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCommentSchema } from '@/lib/validations'
import { COMMENT_LIMITS } from '@/lib/constants'

interface RouteContext {
  params: Promise<{ id: string }>
}

// Helper to build nested comment structure
interface CommentWithReplies {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
  editedAt: Date | null
  isVerifiedPurchase: boolean
  isSeller: boolean
  isHiddenBySeller: boolean
  isRemoved: boolean
  parentId: string | null
  author: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
    isVerifiedSeller: boolean
  }
  replies: CommentWithReplies[]
}

function buildCommentTree(
  comments: CommentWithReplies[],
  parentId: string | null = null,
  depth: number = 0
): CommentWithReplies[] {
  if (depth >= COMMENT_LIMITS.MAX_THREAD_DEPTH) {
    return []
  }

  return comments
    .filter((comment) => comment.parentId === parentId)
    .map((comment) => ({
      ...comment,
      replies: buildCommentTree(comments, comment.id, depth + 1),
    }))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

// GET /api/listings/[id]/comments - Get all comments for a listing (public)
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: listingId } = await context.params

    // Verify listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, sellerId: true },
    })

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Fetch all comments with author info
    const comments = await prisma.comment.findMany({
      where: {
        listingId,
        isRemoved: false,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerifiedSeller: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Build nested tree structure
    const commentTree = buildCommentTree(comments as unknown as CommentWithReplies[])

    // Get total count including hidden
    const totalCount = await prisma.comment.count({
      where: { listingId },
    })

    return NextResponse.json({
      success: true,
      data: {
        comments: commentTree,
        totalCount,
        listingOwnerId: listing.sellerId,
      },
    })
  } catch (error) {
    console.error('GET /api/listings/[id]/comments error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/listings/[id]/comments - Create a new comment (auth required)
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is banned
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isBanned: true, deletedAt: true },
    })

    if (user?.isBanned || user?.deletedAt) {
      return NextResponse.json(
        { success: false, error: 'Your account is not active' },
        { status: 403 }
      )
    }

    const { id: listingId } = await context.params

    // Verify listing exists and get seller info
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, sellerId: true },
    })

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = createCommentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { content, parentId } = validation.data

    // If replying, verify parent comment exists and check depth
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, listingId: true, parentId: true },
      })

      if (!parentComment || parentComment.listingId !== listingId) {
        return NextResponse.json(
          { success: false, error: 'Parent comment not found' },
          { status: 404 }
        )
      }

      // Check thread depth (count ancestors)
      let depth = 1
      let currentParentId: string | null = parentComment.parentId
      while (currentParentId && depth < COMMENT_LIMITS.MAX_THREAD_DEPTH) {
        const ancestor = await prisma.comment.findUnique({
          where: { id: currentParentId },
          select: { parentId: true },
        })
        if (!ancestor) break
        currentParentId = ancestor.parentId
        depth++
      }

      if (depth >= COMMENT_LIMITS.MAX_THREAD_DEPTH) {
        return NextResponse.json(
          { success: false, error: 'Maximum reply depth reached' },
          { status: 400 }
        )
      }
    }

    // Check if user has purchased this listing (verified purchase badge)
    const hasPurchased = await prisma.purchase.findFirst({
      where: {
        listingId,
        buyerId: session.user.id,
        status: 'COMPLETED',
      },
    })

    // Check if user is the listing seller
    const isSeller = listing.sellerId === session.user.id

    // Calculate edit window (15 minutes from now)
    const editWindowEnd = new Date()
    editWindowEnd.setMinutes(editWindowEnd.getMinutes() + COMMENT_LIMITS.EDIT_WINDOW_MINUTES)

    // Create the comment and increment count atomically
    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          content,
          listingId,
          authorId: session.user.id,
          parentId: parentId || null,
          isVerifiedPurchase: !!hasPurchased,
          isSeller,
          canEditUntil: editWindowEnd,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerifiedSeller: true,
            },
          },
        },
      })

      await tx.listing.update({
        where: { id: listingId },
        data: { commentCount: { increment: 1 } },
      })

      return newComment
    })

    return NextResponse.json({
      success: true,
      data: {
        ...comment,
        replies: [],
      },
    })
  } catch (error) {
    console.error('POST /api/listings/[id]/comments error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
