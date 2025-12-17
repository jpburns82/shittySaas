import Link from 'next/link'
import { auth } from '@/lib/auth'

export async function Nav() {
  const session = await auth()
  const user = session?.user

  return (
    <nav className="nav">
      <Link href="/listings">Browse</Link>
      <Link href="/sell">Sell</Link>

      {user ? (
        <>
          <Link href="/dashboard">Dashboard</Link>
          {user.isAdmin && <Link href="/admin">Admin</Link>}
          <Link href="/dashboard/settings" className="font-medium">
            @{user.username}
          </Link>
        </>
      ) : (
        <>
          <Link href="/login">Login</Link>
          <Link href="/register" className="btn btn-primary">
            Sign Up
          </Link>
        </>
      )}
    </nav>
  )
}

// Client version for when session is passed as prop
export function NavClient({ user }: {
  user: {
    username: string
    isAdmin: boolean
  } | null
}) {
  return (
    <nav className="nav">
      <Link href="/listings">Browse</Link>
      <Link href="/sell">Sell</Link>

      {user ? (
        <>
          <Link href="/dashboard">Dashboard</Link>
          {user.isAdmin && <Link href="/admin">Admin</Link>}
          <Link href="/dashboard/settings" className="font-medium">
            @{user.username}
          </Link>
        </>
      ) : (
        <>
          <Link href="/login">Login</Link>
          <Link href="/register" className="btn btn-primary">
            Sign Up
          </Link>
        </>
      )}
    </nav>
  )
}
