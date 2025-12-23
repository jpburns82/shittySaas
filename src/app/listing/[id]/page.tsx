import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ListingDetail } from '@/components/listings/listing-detail'
import { CommentSection } from '@/components/comments/comment-section'
import type { Prisma } from '@prisma/client'

interface ListingPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ListingPageProps) {
  const { id } = await params

  const listing = await prisma.listing.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      status: 'ACTIVE',
    },
    select: {
      title: true,
      shortDescription: true,
      thumbnailUrl: true,
    },
  })

  if (!listing) {
    return { title: 'Listing Not Found' }
  }

  return {
    title: listing.title,
    description: listing.shortDescription,
    openGraph: {
      title: listing.title,
      description: listing.shortDescription,
      images: listing.thumbnailUrl ? [listing.thumbnailUrl] : [],
    },
  }
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params
  const session = await auth()

  // Build visibility query
  // - ACTIVE, non-deleted listings visible to everyone
  // - DRAFT/ARCHIVED/soft-deleted listings visible only to owner or admin
  let whereClause: Prisma.ListingWhereInput

  if (session?.user?.isAdmin) {
    // Admins can see all statuses including soft-deleted
    whereClause = {
      OR: [{ id }, { slug: id }],
    }
  } else if (session?.user?.id) {
    // Logged-in users can see ACTIVE non-deleted listings OR their own drafts/deleted
    whereClause = {
      AND: [
        { OR: [{ id }, { slug: id }] },
        {
          OR: [
            { status: 'ACTIVE', deletedAt: null },
            { sellerId: session.user.id, status: { in: ['DRAFT', 'ARCHIVED'] } },
            { sellerId: session.user.id, deletedAt: { not: null } }, // owner can see their soft-deleted
          ],
        },
      ],
    }
  } else {
    // Anonymous users only see ACTIVE non-deleted listings
    whereClause = {
      OR: [{ id }, { slug: id }],
      status: 'ACTIVE',
      deletedAt: null,
    }
  }

  // Find listing by id or slug
  const listing = await prisma.listing.findFirst({
    where: whereClause,
    include: {
      seller: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          isVerifiedSeller: true,
          sellerTier: true,
          totalSales: true,
          totalDisputes: true,
          disputeRate: true,
          createdAt: true,
          _count: {
            select: {
              listings: { where: { status: 'ACTIVE' } },
              sales: { where: { status: 'COMPLETED' } },
            },
          },
        },
      },
      category: true,
      files: true,
      _count: {
        select: {
          comments: true,
          purchases: true,
        },
      },
    },
  })

  if (!listing) {
    notFound()
  }

  // Increment view count (don't await, fire and forget)
  prisma.listing.update({
    where: { id: listing.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {})

  // Check if current user is the owner
  const isOwner = session?.user?.id === listing.sellerId
  const isAdmin = session?.user?.isAdmin

  // Capture values for server action closure (TypeScript can't narrow across async boundaries)
  const listingId = listing.id
  const listingSlug = listing.slug

  // Server action to publish the listing
  async function publishListing() {
    'use server'
    const session = await auth()
    if (!session?.user) return

    // Verify ownership
    const current = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { sellerId: true },
    })
    if (current?.sellerId !== session.user.id && !session.user.isAdmin) return

    await prisma.listing.update({
      where: { id: listingId },
      data: { status: 'ACTIVE', publishedAt: new Date() },
    })
    revalidatePath(`/listing/${listingSlug}`)
  }

  // Get user's vote if logged in
  let currentUserVote: 1 | -1 | null = null
  if (session?.user?.id) {
    const vote = await prisma.vote.findUnique({
      where: {
        listingId_userId: {
          listingId: listingId,
          userId: session.user.id,
        },
      },
    })
    currentUserVote = vote?.value as 1 | -1 | null
  }

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="breadcrumbs mb-4">
        <Link href="/">Home</Link>
        <span>&gt;</span>
        <Link href="/listings">Listings</Link>
        <span>&gt;</span>
        <Link href={`/category/${listing.category.slug}`}>{listing.category.name}</Link>
        <span>&gt;</span>
        <span>{listing.title}</span>
      </nav>

      {/* Draft Banner */}
      {listing.status === 'DRAFT' && isOwner && (
        <div className="mb-6 p-4 bg-warning/10 border border-warning">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-warning">This listing is a draft</h3>
              <p className="text-sm text-text-muted">Only you can see it. Publish when you&apos;re ready to make it visible.</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/sell/${listing.id}/edit`} className="btn text-sm">
                Edit
              </Link>
              <form action={publishListing}>
                <button type="submit" className="btn-primary text-sm">
                  Publish Listing
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Archived Banner */}
      {listing.status === 'ARCHIVED' && (isOwner || isAdmin) && (
        <div className="mb-6 p-4 bg-text-muted/10 border border-text-muted">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-medium">This listing is archived</h3>
              <p className="text-sm text-text-muted">It&apos;s not visible to the public.</p>
            </div>
            <Link href={`/sell/${listing.id}/edit`} className="btn text-sm">
              Edit Listing
            </Link>
          </div>
        </div>
      )}

      <ListingDetail
        listing={listing}
        isOwner={isOwner}
        currentUserVote={currentUserVote}
      />

      {/* Comments Section */}
      <CommentSection
        listingId={listing.id}
        listingOwnerId={listing.sellerId}
        initialCommentCount={listing._count.comments}
      />
    </div>
  )
}
