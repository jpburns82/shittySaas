import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'

interface VerifyPageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams
  const token = params.token

  if (!token) {
    return (
      <div className="container py-12">
        <div className="max-w-md mx-auto card text-center">
          <h1 className="font-display text-2xl mb-4 text-accent-red">Invalid Link</h1>
          <p className="text-text-secondary mb-4">
            This verification link is invalid or missing.
          </p>
          <Link href="/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Find user with this token
  const user = await prisma.user.findFirst({
    where: { emailVerifyToken: token },
  })

  if (!user) {
    return (
      <div className="container py-12">
        <div className="max-w-md mx-auto card text-center">
          <h1 className="font-display text-2xl mb-4 text-accent-red">Invalid Token</h1>
          <p className="text-text-secondary mb-4">
            This verification link is invalid or has already been used.
          </p>
          <Link href="/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Verify the email
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      emailVerifyToken: null,
    },
  })

  return (
    <div className="container py-12">
      <div className="max-w-md mx-auto card text-center">
        <h1 className="font-display text-2xl mb-4 text-accent-green">Email Verified!</h1>
        <p className="text-text-secondary mb-6">
          Your email has been verified. You can now log in and start using SideProject.deals.
        </p>
        <Link href="/login">
          <Button variant="primary">Login to Your Account</Button>
        </Link>
      </div>
    </div>
  )
}
