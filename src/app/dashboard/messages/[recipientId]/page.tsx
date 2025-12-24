import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ThreadClient } from './thread-client'

interface PageProps {
  params: Promise<{ recipientId: string }>
  searchParams: Promise<{ listing?: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { recipientId } = await params
  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { username: true },
  })

  return {
    title: recipient ? `Messages with @${recipient.username}` : 'Messages',
  }
}

export default async function ThreadDetailPage({ params, searchParams }: PageProps) {
  const session = await auth()
  if (!session) {
    redirect('/login')
  }

  const { recipientId } = await params
  const { listing: listingId } = await searchParams
  const currentUserId = session.user.id

  // Parallelize independent queries for performance
  const [recipient, blockStatus, currentUser, listing, messages, thread] = await Promise.all([
    // Get recipient
    prisma.user.findUnique({
      where: { id: recipientId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isAdmin: true,
      },
    }),
    // Check if blocked (either direction)
    prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: currentUserId, blockedId: recipientId },
          { blockerId: recipientId, blockedId: currentUserId },
        ],
      },
    }),
    // Get current user (for admin check)
    prisma.user.findUnique({
      where: { id: currentUserId },
      select: { isAdmin: true },
    }),
    // Get listing if provided
    listingId
      ? prisma.listing.findUnique({
          where: { id: listingId },
          select: { id: true, title: true, slug: true, status: true },
        })
      : Promise.resolve(null),
    // Get messages
    prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: recipientId },
          { senderId: recipientId, receiverId: currentUserId },
        ],
        ...(listingId ? { listingId } : {}),
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true, isAdmin: true } },
        receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true, isAdmin: true } },
        listing: { select: { id: true, title: true, slug: true } },
        attachments: true,
      },
    }),
    // Get or find thread for this conversation
    prisma.messageThread.findFirst({
      where: {
        OR: [
          { buyerId: currentUserId, sellerId: recipientId, listingId: listingId || null },
          { buyerId: recipientId, sellerId: currentUserId, listingId: listingId || null },
        ],
      },
      include: {
        buyer: { select: { id: true, username: true } },
        seller: { select: { id: true, username: true } },
      },
    }),
  ])

  if (!recipient) {
    notFound()
  }

  const isBlocked = !!blockStatus
  const blockedByMe = blockStatus?.blockerId === currentUserId
  const isListingDeleted = listing?.status === 'REMOVED' || listing?.status === 'ARCHIVED'

  // Mark messages as read (fire-and-forget, don't block render)
  prisma.message.updateMany({
    where: {
      receiverId: currentUserId,
      senderId: recipientId,
      ...(listingId ? { listingId } : {}),
      readAt: null,
    },
    data: { readAt: new Date() },
  }).catch(() => {}) // Ignore errors, this is non-critical

  // Get conversation start date
  const firstMessage = messages[0]
  const conversationStarted = firstMessage?.createdAt

  // Get reports for this conversation (admin only)
  let reportCount = 0
  let lastReport: { reason: string; createdAt: Date } | null = null
  if (currentUser?.isAdmin) {
    const reports = await prisma.report.findMany({
      where: {
        entityType: 'MESSAGE',
        OR: messages.map((m) => ({ id: m.id })).length > 0
          ? [{ reporterId: currentUserId }, { reporterId: recipientId }]
          : [],
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    })
    reportCount = reports.length
    lastReport = reports[0] ? { reason: reports[0].reason, createdAt: reports[0].createdAt } : null
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
      {/* Back Link */}
      <div className="mb-4">
        <Link href="/dashboard/messages" className="btn-link text-sm">
          ← Back to Inbox
        </Link>
      </div>

      {/* Thread Header */}
      <div className="card mb-4">
        <div className="font-display text-lg">
          {listing ? (
            <>
              RE:{' '}
              {isListingDeleted ? (
                <span className="text-text-muted">{listing.title}</span>
              ) : (
                <Link href={`/listings/${listing.slug}`} className="hover:underline">
                  {listing.title}
                </Link>
              )}
            </>
          ) : (
            'General Conversation'
          )}
        </div>
        <div className="text-sm text-text-muted">
          Conversation with{' '}
          <Link href={`/user/${recipient.username}`} className="hover:underline">
            @{recipient.username}
          </Link>
          {recipient.displayName && ` (${recipient.displayName})`}
          {listing && <span> · Listing #{listing.id.slice(-4)}</span>}
        </div>
        {conversationStarted && (
          <div className="text-xs text-text-muted mt-1">
            Started {new Date(conversationStarted).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        )}
      </div>

      {/* Deleted Listing Banner */}
      {listing && isListingDeleted && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-400 text-yellow-800 text-sm">
          ⚠ This listing has been removed from the marketplace
        </div>
      )}

      {/* Blocked Banner */}
      {isBlocked && (
        <div className="mb-4 p-3 bg-red-50 border border-accent-red text-accent-red text-sm">
          {blockedByMe ? (
            <>
              🚫 You have blocked this user. You cannot send or receive messages from @{recipient.username}.
            </>
          ) : (
            <>🚫 You cannot message this user.</>
          )}
        </div>
      )}

      {/* Thread Client (messages + composer) */}
      <ThreadClient
        messages={messages}
        currentUserId={currentUserId}
        recipientId={recipientId}
        listingId={listingId}
        listingSlug={listing?.slug}
        threadId={thread?.id}
        threadStatus={thread?.status}
        suspendReason={thread?.suspendReason}
        isBlocked={isBlocked}
        blockedByMe={blockedByMe}
        isAdmin={currentUser?.isAdmin || false}
        recipient={recipient}
        buyer={thread?.buyer}
        seller={thread?.seller}
        reportCount={reportCount}
        lastReport={lastReport}
      />
    </div>
  )
}
