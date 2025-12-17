'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface SidebarLink {
  href: string
  label: string
  icon?: string
  badge?: string | number
}

interface SidebarProps {
  links: SidebarLink[]
  title?: string
}

export function Sidebar({ links, title }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-full md:w-64 bg-bg-secondary border border-border-dark p-4">
      {title && (
        <h2 className="font-display text-lg mb-4 pb-2 border-b border-border-light">
          {title}
        </h2>
      )}
      <nav className="space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/')

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center justify-between px-3 py-2 text-sm hover:bg-bg-accent',
                isActive && 'bg-text-primary text-white hover:bg-text-primary'
              )}
            >
              <span className="flex items-center gap-2">
                {link.icon && <span>{link.icon}</span>}
                {link.label}
              </span>
              {link.badge && (
                <span className={cn(
                  'text-xs px-1.5 py-0.5 font-mono',
                  isActive ? 'bg-white text-text-primary' : 'bg-btn-bg'
                )}>
                  {link.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

// Dashboard sidebar preset
export function DashboardSidebar({ unreadMessages = 0, pendingDeliveries = 0 }) {
  const links: SidebarLink[] = [
    { href: '/dashboard', label: 'Overview', icon: '📊' },
    { href: '/dashboard/listings', label: 'My Listings', icon: '📦' },
    { href: '/dashboard/sales', label: 'Sales', icon: '💰', badge: pendingDeliveries || undefined },
    { href: '/dashboard/purchases', label: 'Purchases', icon: '🛒' },
    { href: '/dashboard/messages', label: 'Messages', icon: '💬', badge: unreadMessages || undefined },
    { href: '/dashboard/payouts', label: 'Payouts', icon: '🏦' },
    { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
  ]

  return <Sidebar links={links} title="Dashboard" />
}

// Admin sidebar preset
export function AdminSidebar() {
  const links: SidebarLink[] = [
    { href: '/admin', label: 'Overview', icon: '📊' },
    { href: '/admin/listings', label: 'Listings', icon: '📦' },
    { href: '/admin/users', label: 'Users', icon: '👥' },
    { href: '/admin/reports', label: 'Reports', icon: '🚨' },
    { href: '/admin/audit-log', label: 'Audit Log', icon: '📋' },
  ]

  return <Sidebar links={links} title="Admin" />
}
