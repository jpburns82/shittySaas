// Generic API response types

export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export type ApiError = {
  success: false
  error: string
  message?: string
  code?: string
}

export type PaginatedResponse<T> = {
  success: true
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

// Auth responses
export type AuthResponse = ApiResponse<{
  user: {
    id: string
    email: string
    username: string
  }
}>

export type RegisterResponse = ApiResponse<{
  message: string
  requiresVerification: boolean
}>

// Listing responses
export type CreateListingResponse = ApiResponse<{
  id: string
  slug: string
}>

export type UpdateListingResponse = ApiResponse<{
  id: string
  slug: string
}>

// Upload responses
export type PresignedUrlResponse = ApiResponse<{
  uploadUrl: string
  publicUrl: string
  key: string
}>

export type UploadCompleteResponse = ApiResponse<{
  url: string
  key: string
  fileName: string
  fileSize: number
}>

// Stripe responses
export type StripeConnectResponse = ApiResponse<{
  accountId: string
  onboardingUrl: string
}>

export type CheckoutResponse = ApiResponse<{
  checkoutUrl: string
  sessionId: string
}>

// Message responses
export type SendMessageResponse = ApiResponse<{
  messageId: string
}>

// Vote responses
export type VoteResponse = ApiResponse<{
  voteScore: number
  upvoteCount: number
  downvoteCount: number
  userVote: 1 | -1 | null
}>

// Search params type
export type SearchParams = {
  q?: string
  category?: string
  priceType?: string
  minPrice?: string
  maxPrice?: string
  techStack?: string
  sort?: string
  page?: string
}
