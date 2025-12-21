import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminSidebar } from '@/components/layout/sidebar'

export const metadata = {
  title: {
    template: '%s | Admin - UndeadList',
    default: 'Admin Dashboard',
  },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/login?callbackUrl=/admin')
  }

  if (!session.user.isAdmin) {
    redirect('/dashboard')
  }

  // Check if admin is banned or deleted (catches mid-session bans)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isBanned: true, deletedAt: true },
  })

  if (user?.isBanned || user?.deletedAt) {
    redirect('/login')
  }

  return (
    <div className="container py-8">
      <div className="flex gap-8">
        <AdminSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
