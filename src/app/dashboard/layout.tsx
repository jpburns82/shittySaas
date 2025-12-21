import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardSidebar } from '@/components/layout/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard')
  }

  // Get counts for sidebar badges
  const [unreadMessages, pendingDeliveries] = await Promise.all([
    prisma.message.count({
      where: {
        receiverId: session.user.id,
        readAt: null,
      },
    }),
    prisma.purchase.count({
      where: {
        sellerId: session.user.id,
        status: 'COMPLETED',
        deliveryStatus: 'PENDING',
      },
    }),
  ])

  return (
    <div className="container py-8 min-h-[calc(100vh-200px)]">
      <div className="flex flex-col md:flex-row gap-8">
        <DashboardSidebar
          unreadMessages={unreadMessages}
          pendingDeliveries={pendingDeliveries}
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
