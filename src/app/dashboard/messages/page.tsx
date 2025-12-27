import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NewMessageButton } from '@/components/messages/new-message-button'
import { ConversationCard } from '@/components/messages/conversation-card'

export const metadata = {
  title: 'Messages',
}

export default async function DashboardMessagesPage() {
  const session = await auth()
  const userId = session!.user.id

  // Get conversations (grouped by other user) - filter out deleted messages
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, deletedBySender: false },
        { receiverId: userId, deletedByReceiver: false },
      ],
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
          {conversations.map((conv) => (
            <ConversationCard
              key={conv.key}
              conversationKey={conv.key}
              otherUser={conv.otherUser}
              listing={conv.listing}
              lastMessage={conv.lastMessage}
              unreadCount={conv.unreadCount}
              currentUserId={userId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
