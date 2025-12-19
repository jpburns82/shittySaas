import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ListingForm } from '@/components/listings/listing-form'
import { updateListingSchema } from '@/lib/validations'
import { slugify } from '@/lib/utils'

interface EditListingPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: 'Edit Listing',
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params
  const session = await auth()

  // Require login
  if (!session?.user) {
    redirect(`/login?callbackUrl=/sell/${id}/edit`)
  }

  // Fetch listing
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      category: true,
      files: true,
    },
  })

  if (!listing) {
    notFound()
  }

  // Check ownership
  if (listing.sellerId !== session.user.id && !session.user.isAdmin) {
    redirect('/dashboard/listings')
  }

  // Fetch categories
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  // Handle update
  async function handleSubmit(data: unknown): Promise<{
    success: false
    errors: Record<string, string[]>
    message: string
  } | void> {
    'use server'

    const session = await auth()
    if (!session?.user) {
      return {
        success: false,
        errors: {},
        message: 'You must be logged in to edit a listing',
      }
    }

    // Re-fetch listing to check ownership
    const currentListing = await prisma.listing.findUnique({
      where: { id },
      select: { sellerId: true, title: true, slug: true },
    })

    if (!currentListing) {
      return {
        success: false,
        errors: {},
        message: 'Listing not found',
      }
    }

    if (currentListing.sellerId !== session.user.id && !session.user.isAdmin) {
      return {
        success: false,
        errors: {},
        message: 'You do not have permission to edit this listing',
      }
    }

    const validation = updateListingSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
        message: validation.error.errors[0].message,
      }
    }

    const validData = validation.data

    // Check if title changed and regenerate slug if needed
    let newSlug = currentListing.slug
    if (validData.title && validData.title !== currentListing.title) {
      newSlug = slugify(validData.title)
      const existing = await prisma.listing.findFirst({
        where: { slug: newSlug, id: { not: id } },
      })
      if (existing) {
        newSlug = `${newSlug}-${Date.now()}`
      }
    }

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: {
        ...validData,
        slug: newSlug,
      },
    })

    redirect(`/listing/${updatedListing.slug}`)
  }

  // Convert listing to form data format
  const initialData = {
    title: listing.title,
    shortDescription: listing.shortDescription,
    description: listing.description,
    categoryId: listing.categoryId,
    priceType: listing.priceType,
    priceInCents: listing.priceInCents || undefined,
    minPriceInCents: listing.minPriceInCents || undefined,
    techStack: listing.techStack,
    liveUrl: listing.liveUrl || undefined,
    repoUrl: listing.repoUrl || undefined,
    videoUrl: listing.videoUrl || undefined,
    deliveryMethod: listing.deliveryMethod,
    deliveryTimeframeDays: listing.deliveryTimeframeDays,
    includesSourceCode: listing.includesSourceCode,
    includesDatabase: listing.includesDatabase,
    includesDocs: listing.includesDocs,
    includesDeployGuide: listing.includesDeployGuide,
    includesSupport: listing.includesSupport,
    supportDays: listing.supportDays || undefined,
    includesUpdates: listing.includesUpdates,
    includesCommercialLicense: listing.includesCommercialLicense,
    includesWhiteLabel: listing.includesWhiteLabel,
    whatsIncludedCustom: listing.whatsIncludedCustom || undefined,
  }

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <nav className="breadcrumbs mb-6">
          <Link href="/dashboard">Dashboard</Link>
          <span>&gt;</span>
          <Link href="/dashboard/listings">My Listings</Link>
          <span>&gt;</span>
          <span>Edit</span>
        </nav>

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl mb-2">Edit Listing</h1>
            <p className="text-text-muted">{listing.title}</p>
          </div>
          <Link href={`/listing/${listing.slug}`}>
            <span className="btn">View Listing →</span>
          </Link>
        </div>

        {/* Status info */}
        <div className="mb-6 p-3 bg-bg-primary border border-border-light text-sm">
          <span className="font-medium">Status:</span>{' '}
          <span className={
            listing.status === 'ACTIVE' ? 'text-accent-green' :
            listing.status === 'DRAFT' ? 'text-text-muted' :
            'text-accent-red'
          }>
            {listing.status}
          </span>
          {listing.status === 'DRAFT' && (
            <span className="text-text-muted ml-2">
              — Publish when ready
            </span>
          )}
        </div>

        {/* Form */}
        <div className="card">
          <ListingForm
            categories={categories}
            initialData={initialData}
            onSubmit={handleSubmit}
            submitLabel="Save Changes"
          />
        </div>

        {/* Danger zone */}
        <div className="mt-8 card border-accent-red">
          <h3 className="font-display text-base text-accent-red mb-4">Danger Zone</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Archive this listing</p>
              <p className="text-xs text-text-muted">
                Remove from public view. Can be restored later.
              </p>
            </div>
            <button className="btn text-sm">Archive</button>
          </div>
        </div>
      </div>
    </div>
  )
}
