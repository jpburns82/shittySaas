import type { Listing, Category, User, Vote, Comment, ListingFile } from '@prisma/client'

// Listing with relations for display
export type ListingWithSeller = Listing & {
  seller: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl' | 'isVerifiedSeller'>
  category: Category
}

// Listing card display (minimal data for grids)
export type ListingCard = Pick<
  Listing,
  | 'id'
  | 'slug'
  | 'title'
  | 'shortDescription'
  | 'priceType'
  | 'priceInCents'
  | 'thumbnailUrl'
  | 'techStack'
  | 'voteScore'
  | 'upvoteCount'
  | 'downvoteCount'
  | 'createdAt'
  | 'featured'
> & {
  seller: Pick<User, 'username' | 'isVerifiedSeller' | 'sellerTier'>
  category: Pick<Category, 'slug' | 'name'>
}

// Full listing detail page
export type ListingDetail = Listing & {
  seller: Pick<
    User,
    | 'id'
    | 'username'
    | 'displayName'
    | 'avatarUrl'
    | 'bio'
    | 'isVerifiedSeller'
    | 'sellerTier'
    | 'totalSales'
    | 'totalDisputes'
    | 'disputeRate'
    | 'createdAt'
  > & {
    _count: {
      listings: number
      sales: number
    }
  }
  category: Category
  files: ListingFile[]
  _count: {
    comments: number
    purchases: number
  }
}

// Listing for editing (seller's view)
export type ListingForEdit = Listing & {
  files: ListingFile[]
  category: Category
}

// Vote with user info
export type VoteWithUser = Vote & {
  user: Pick<User, 'username'>
}

// Comment with author info
export type CommentWithAuthor = Comment & {
  author: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl' | 'isVerifiedSeller'>
  replies?: CommentWithAuthor[]
}

// Filter/sort options
export type ListingSortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'top'

export type ListingFilters = {
  categorySlug?: string
  priceType?: 'FREE' | 'FIXED' | 'PAY_WHAT_YOU_WANT' | 'CONTACT' | 'ALL'
  minPrice?: number
  maxPrice?: number
  techStack?: string[]
  query?: string
}

// Paginated listing response
export type PaginatedListings = {
  listings: ListingCard[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
