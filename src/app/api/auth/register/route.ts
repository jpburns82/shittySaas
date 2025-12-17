import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { registerSchema } from '@/lib/validations'
import { sendVerificationEmail } from '@/lib/email'
import { randomBytes } from 'crypto'

// POST /api/auth/register - Register a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = registerSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, username, password } = validation.data

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    })

    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUsername) {
      return NextResponse.json(
        { success: false, error: 'Username already taken' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex')

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash: hashedPassword,
        emailVerifyToken: verificationToken,
      },
      select: {
        id: true,
        email: true,
        username: true,
      },
    })

    // Send verification email
    await sendVerificationEmail(email, verificationToken, username)

    return NextResponse.json({
      success: true,
      data: user,
      message: 'Registration successful. Please check your email to verify your account.',
    })
  } catch (error) {
    console.error('POST /api/auth/register error:', error)
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    )
  }
}
