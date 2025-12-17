import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string }>
}

// PATCH /api/admin/listings/[id] - Update listing status (admin)
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { id } = await context.params
    const body = await request.json()
    const { status } = body

    const validStatuses = ['DRAFT', 'PENDING', 'ACTIVE', 'SOLD', 'REJECTED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    const listing = await prisma.listing.update({
      where: { id },
      data: {
        status,
        ...(status === 'ACTIVE' ? { approvedAt: new Date() } : {}),
      },
    })

    return NextResponse.json({
      success: true,
      data: listing,
    })
  } catch (error) {
    console.error('PATCH /api/admin/listings/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update listing' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/listings/[id] - Delete listing (admin)
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { id } = await context.params

    await prisma.listing.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    })
  } catch (error) {
    console.error('DELETE /api/admin/listings/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete listing' },
      { status: 500 }
    )
  }
}
