import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'
import { NewMessageButton } from '@/components/messages/new-message-button'

export const metadata = {
  title: 'Messages',
}

export default async function DashboardMessagesPage() {
  const session = await auth()
  const userId = session!.user.id

  // Get conversations (grouped by other user)
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, username: true, displayName: true, avatarUrl: true, isAdmin: true } },
      receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true, isAdmin: true } },
      listing: { select: { id: true, title: true, slug: true } },
    },
  })

  // Group by conversation (other user + listing)
  const conversationsMap = new Map<string, typeof messages[0][]>()

  for (const message of messages) {
    const otherUserId = message.senderId === userId ? message.receiverId : message.senderId
    const key = `${otherUserId}-${message.listingId || 'general'}`

    if (!conversationsMap.has(key)) {
      conversationsMap.set(key, [])
    }
    conversationsMap.get(key)!.push(message)
  }

  const conversations = Array.from(conversationsMap.entries()).map(([key, msgs]) => {
    const lastMessage = msgs[0]
    const otherUser =
      lastMessage.senderId === userId ? lastMessage.receiver : lastMessage.sender
    const unreadCount = msgs.filter(
      (m) => m.receiverId === userId && !m.readAt
    ).length

    return {
      key,
      otherUser,
      listing: lastMessage.listing,
      lastMessage,
      unreadCount,
    }
  })

  // Helper to check if the last message is from admin/system (not the current user)
  const isSystemMessage = (conv: typeof conversations[0]) => {
    const sender = conv.lastMessage.sender
    return sender.isAdmin && sender.id !== userId
  }

  return (
    <div>
      {/* Header with New Message button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Messages</h1>
        <NewMessageButton />
      </div>

      {conversations.length === 0 ? (
        <div className="card text-center py-12">
          <p className="font-display text-xl mb-2">No messages yet</p>
          <p className="text-text-muted">
            When someone messages you about a listing, it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const isSystem = isSystemMessage(conv)

            return (
              <Link
                key={conv.key}
                href={`/dashboard/messages/${conv.otherUser.id}${conv.listing ? `?listing=${conv.listing.id}` : ''}`}
                className="block"
              >
                <div
                  className={`card flex items-start gap-4 hover:bg-bg-accent relative ${
                    conv.unreadCount > 0 ? 'bg-accent-blue/10' : ''
                  } ${isSystem ? 'bg-secondary' : ''}`}
                >
                  {/* Blue dot indicator for unread */}
                  {conv.unreadCount > 0 && (
                    <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-accent-blue" />
                  )}

                  {/* Avatar - gear icon for system messages */}
                  {isSystem ? (
                    <div className="w-12 h-12 bg-btn-bg border border-border-dark flex items-center justify-center text-lg ml-2">
                      <span>&#9881;</span>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-btn-bg border border-border-dark flex items-center justify-center font-display text-lg ml-2">
                      {conv.otherUser.displayName?.[0] || conv.otherUser.username[0].toUpperCase()}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isSystem ? (
                        <span className="font-medium text-text-muted">SYSTEM</span>
                      ) : (
                        <span className={`font-medium ${conv.unreadCount > 0 ? 'font-bold' : ''}`}>
                          @{conv.otherUser.username}
                        </span>
                      )}
                      {conv.unreadCount > 0 && (
                        <span className="bg-accent-blue text-white text-xs px-1.5 py-0.5">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    {conv.listing && (
                      <div className={`text-xs text-text-muted ${conv.unreadCount > 0 ? 'font-semibold' : ''}`}>
                        Re: {conv.listing.title}
                      </div>
                    )}
                    <div className="text-sm text-text-muted truncate mt-1">
                      {conv.lastMessage.senderId === userId && (
                        <span className="text-text-secondary">You: </span>
                      )}
                      {conv.lastMessage.content.slice(0, 80)}
                      {conv.lastMessage.content.length > 80 && '...'}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="text-xs text-text-muted">
                    {formatRelativeTime(conv.lastMessage.createdAt)}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
