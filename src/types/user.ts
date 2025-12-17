import type { User, Listing, Purchase, Message, MessageAttachment } from '@prisma/client'

// Current user session data
export type SessionUser = {
  id: string
  email: string
  username: string
  name: string | null
  isAdmin: boolean
  isVerifiedSeller: boolean
  stripeOnboarded: boolean
}

// Public user profile
export type PublicProfile = Pick<
  User,
  | 'id'
  | 'username'
  | 'displayName'
  | 'bio'
  | 'avatarUrl'
  | 'websiteUrl'
  | 'twitterHandle'
  | 'githubHandle'
  | 'isVerifiedSeller'
  | 'createdAt'
> & {
  _count: {
    listings: number
    sales: number
    purchases: number
  }
  listings: Array<{
    id: string
    slug: string
    title: string
    shortDescription: string
    priceType: string
    priceInCents: number | null
    thumbnailUrl: string | null
    voteScore: number
  }>
}

// User for seller display (on listings)
export type SellerInfo = Pick<
  User,
  'id' | 'username' | 'displayName' | 'avatarUrl' | 'isVerifiedSeller' | 'createdAt'
> & {
  _count: {
    listings: number
    sales: number
  }
}

// Dashboard stats
export type DashboardStats = {
  totalEarnings: number
  totalSales: number
  activeListings: number
  pendingDeliveries: number
  unreadMessages: number
}

// Purchase with listing info (for buyer's purchase history)
export type PurchaseWithListing = Purchase & {
  listing: {
    id: string
    slug: string
    title: string
    thumbnailUrl: string | null
    deliveryMethod: string
  }
  seller: {
    username: string
  }
}

// Sale with buyer info (for seller's sales history)
export type SaleWithBuyer = Purchase & {
  listing: {
    id: string
    slug: string
    title: string
  }
  buyer: {
    username: string
    email: string
  } | null
  guestEmail: string | null
}

// Message conversation preview
export type ConversationPreview = {
  id: string
  otherUser: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>
  listing?: {
    id: string
    title: string
    slug: string
  }
  lastMessage: {
    content: string
    createdAt: Date
    isFromMe: boolean
  }
  unreadCount: number
}

// Full message with sender/receiver
export type MessageWithUsers = Message & {
  sender: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>
  receiver: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>
  listing?: {
    id: string
    title: string
    slug: string
  } | null
  attachments?: MessageAttachment[]
}

// Message with attachments included
export type MessageWithAttachments = Message & {
  sender: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl' | 'isAdmin'>
  receiver: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl' | 'isAdmin'>
  listing?: {
    id: string
    title: string
    slug: string
  } | null
  attachments: MessageAttachment[]
}

// Attachment data for upload/send
export type AttachmentUpload = {
  key: string
  url: string
  fileName: string
  fileSize: number
  mimeType: string
}

// Attachment data for sending with message
export type AttachmentInput = {
  key: string
  fileName: string
  fileSize: number
  mimeType: string
}
