import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const voteSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1)]),
})

// POST - Create, update, or toggle vote
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to vote' },
        { status: 401 }
      )
    }

    const { id: listingId } = await params
    const body = await request.json()
    const validation = voteSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid vote value. Must be 1 (upvote) or -1 (downvote).' },
        { status: 400 }
      )
    }

    const { value } = validation.data

    // Check listing exists
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

    // Prevent voting on own listing
    if (listing.sellerId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot vote on your own listing' },
        { status: 403 }
      )
    }

    // Check for existing vote
    const existingVote = await prisma.vote.findUnique({
      where: {
        listingId_userId: {
          listingId,
          userId: session.user.id,
        },
      },
    })

    let result
    let action: 'created' | 'updated' | 'removed'

    if (existingVote) {
      if (existingVote.value === value) {
        // Same vote value = remove vote (toggle off)
        await prisma.vote.delete({
          where: { id: existingVote.id },
        })

        // Update denormalized counts
        await prisma.listing.update({
          where: { id: listingId },
          data: {
            voteScore: { decrement: value },
            upvoteCount: value === 1 ? { decrement: 1 } : undefined,
            downvoteCount: value === -1 ? { decrement: 1 } : undefined,
          },
        })

        action = 'removed'
        result = null
      } else {
        // Different vote value = change vote
        result = await prisma.vote.update({
          where: { id: existingVote.id },
          data: { value },
        })

        // Update denormalized counts (swing of 2: remove old vote effect, add new)
        await prisma.listing.update({
          where: { id: listingId },
          data: {
            voteScore: { increment: value * 2 }, // +2 or -2
            upvoteCount: value === 1 ? { increment: 1 } : { decrement: 1 },
            downvoteCount: value === -1 ? { increment: 1 } : { decrement: 1 },
          },
        })

        action = 'updated'
      }
    } else {
      // Create new vote
      result = await prisma.vote.create({
        data: {
          userId: session.user.id,
          listingId,
          value,
        },
      })

      // Update denormalized counts
      await prisma.listing.update({
        where: { id: listingId },
        data: {
          voteScore: { increment: value },
          upvoteCount: value === 1 ? { increment: 1 } : undefined,
          downvoteCount: value === -1 ? { increment: 1 } : undefined,
        },
      })

      action = 'created'
    }

    // Fetch updated counts
    const updatedListing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        voteScore: true,
        upvoteCount: true,
        downvoteCount: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        action,
        vote: result,
        counts: {
          score: updatedListing?.voteScore ?? 0,
          upvotes: updatedListing?.upvoteCount ?? 0,
          downvotes: updatedListing?.downvoteCount ?? 0,
        },
        userVote: result?.value ?? null,
      },
    })
  } catch (error) {
    console.error('POST /api/listings/[id]/vote error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process vote' },
      { status: 500 }
    )
  }
}

// GET - Get current vote counts and user's vote
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: listingId } = await params

    // Get listing vote counts (public)
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        voteScore: true,
        upvoteCount: true,
        downvoteCount: true,
      },
    })

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Get user's vote if authenticated
    let userVote: 1 | -1 | null = null
    if (session?.user?.id) {
      const vote = await prisma.vote.findUnique({
        where: {
          listingId_userId: {
            listingId,
            userId: session.user.id,
          },
        },
      })
      userVote = (vote?.value as 1 | -1) ?? null
    }

    return NextResponse.json({
      success: true,
      data: {
        counts: {
          score: listing.voteScore,
          upvotes: listing.upvoteCount,
          downvotes: listing.downvoteCount,
        },
        userVote,
      },
    })
  } catch (error) {
    console.error('GET /api/listings/[id]/vote error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get vote data' },
      { status: 500 }
    )
  }
}
