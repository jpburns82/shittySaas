import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const listings = await prisma.listing.findMany({
    where: { sellerId: session.user.id },
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      priceInCents: true,
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({ success: true, data: listings })
}
