import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirmation: z.literal('DELETE', {
    errorMap: () => ({ message: 'Please type DELETE to confirm' }),
  }),
})

export async function DELETE(request: Request) {
  try {
    const user = await requireAuth()

    const body = await request.json()

    // Validate input
    const result = deleteAccountSchema.safeParse(body)
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors
      const firstError = Object.values(errors)[0]?.[0] || 'Validation failed'
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      )
    }

    const { password } = result.data

    // Fetch user with password hash
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, passwordHash: true },
    })

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify password
    const isValid = await bcrypt.compare(password, dbUser.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Incorrect password' },
        { status: 400 }
      )
    }

    // Perform soft delete in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Archive all user's listings
      await tx.listing.updateMany({
        where: { sellerId: user.id },
        data: { status: 'ARCHIVED' },
      })

      // 2. Soft delete and anonymize user
      await tx.user.update({
        where: { id: user.id },
        data: {
          deletedAt: new Date(),
          // Anonymize identifiable data
          email: `deleted_${user.id}@deleted.local`,
          username: `deleted_${user.id}`,
          displayName: null,
          bio: null,
          avatarUrl: null,
          websiteUrl: null,
          twitterHandle: null,
          githubHandle: null,
          // Clear Stripe connection
          stripeAccountId: null,
          stripeOnboarded: false,
          stripePayoutsEnabled: false,
          // Clear verification tokens
          emailVerifyToken: null,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Account deletion error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'You must be logged in' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}
