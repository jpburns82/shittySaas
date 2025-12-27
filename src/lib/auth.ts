import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.passwordHash) {
          return null
        }

        // Block deleted or banned users from logging in
        if (user.deletedAt || user.isBanned) {
          return null
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isValid) {
          return null
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.displayName || user.username,
          username: user.username,
          isAdmin: user.isAdmin,
          isVerifiedSeller: user.isVerifiedSeller,
          stripeOnboarded: user.stripeOnboarded,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const customUser = user as {
          id: string
          username: string
          isAdmin: boolean
          isVerifiedSeller: boolean
          stripeOnboarded: boolean
        }
        token.id = customUser.id
        token.username = customUser.username
        token.isAdmin = customUser.isAdmin
        token.isVerifiedSeller = customUser.isVerifiedSeller
        token.stripeOnboarded = customUser.stripeOnboarded
      }
      return token
    },
    async session({ session, token }) {
      try {
        if (session.user && token) {
          session.user.id = (token.id as string) || ''
          session.user.username = (token.username as string) || ''
          session.user.isAdmin = (token.isAdmin as boolean) || false
          session.user.isVerifiedSeller = (token.isVerifiedSeller as boolean) || false
          session.user.stripeOnboarded = (token.stripeOnboarded as boolean) || false
        }
      } catch (error) {
        console.error('[AUTH] Session callback error:', error)
      }
      return session
    },
  },
})

// Helper to get current user on server
export async function getCurrentUser() {
  const session = await auth()
  return session?.user ?? null
}

// Helper to require auth
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

// Helper to require admin
export async function requireAdmin() {
  const user = await requireAuth()
  if (!user.isAdmin) {
    throw new Error('Forbidden')
  }
  return user
}

// Password hashing helper
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

// Extend next-auth types
declare module 'next-auth' {
  interface User {
    username?: string
    isAdmin?: boolean
    isVerifiedSeller?: boolean
    stripeOnboarded?: boolean
  }

  interface Session {
    user: User & {
      id: string
      username: string
      isAdmin: boolean
      isVerifiedSeller: boolean
      stripeOnboarded: boolean
    }
  }
}
