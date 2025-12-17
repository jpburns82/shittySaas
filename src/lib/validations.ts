import { z } from 'zod'
import { LISTING_LIMITS, MESSAGE_LIMITS, USERNAME_REGEX } from './constants'

// ----- USER SCHEMAS -----

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(USERNAME_REGEX, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const updateProfileSchema = z.object({
  displayName: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  twitterHandle: z.string().max(15).optional(),
  githubHandle: z.string().max(39).optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// ----- LISTING SCHEMAS -----

export const createListingSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(LISTING_LIMITS.TITLE_MAX_LENGTH, `Title must be at most ${LISTING_LIMITS.TITLE_MAX_LENGTH} characters`),
  shortDescription: z
    .string()
    .min(10, 'Short description must be at least 10 characters')
    .max(LISTING_LIMITS.SHORT_DESC_MAX_LENGTH, `Short description must be at most ${LISTING_LIMITS.SHORT_DESC_MAX_LENGTH} characters`),
  description: z
    .string()
    .min(50, 'Description must be at least 50 characters')
    .max(LISTING_LIMITS.DESCRIPTION_MAX_LENGTH, `Description must be at most ${LISTING_LIMITS.DESCRIPTION_MAX_LENGTH} characters`),
  categoryId: z.string().min(1, 'Category is required'),
  priceType: z.enum(['FREE', 'FIXED', 'PAY_WHAT_YOU_WANT', 'CONTACT']),
  priceInCents: z.number().min(0).optional(),
  minPriceInCents: z.number().min(0).optional(),
  techStack: z.array(z.string()).max(LISTING_LIMITS.MAX_TECH_STACK_TAGS),
  liveUrl: z.string().url().optional().or(z.literal('')),
  repoUrl: z.string().url().optional().or(z.literal('')),
  videoUrl: z.string().url().optional().or(z.literal('')),
  deliveryMethod: z.enum(['INSTANT_DOWNLOAD', 'REPOSITORY_ACCESS', 'MANUAL_TRANSFER', 'DOMAIN_TRANSFER']),
  deliveryTimeframeDays: z.number().min(0).max(30).optional(),
  // What's included
  includesSourceCode: z.boolean().default(true),
  includesDatabase: z.boolean().default(false),
  includesDocs: z.boolean().default(false),
  includesDeployGuide: z.boolean().default(false),
  includesSupport: z.boolean().default(false),
  supportDays: z.number().min(0).max(365).optional(),
  includesUpdates: z.boolean().default(false),
  includesCommercialLicense: z.boolean().default(true),
  includesWhiteLabel: z.boolean().default(false),
  whatsIncludedCustom: z.string().max(LISTING_LIMITS.WHATS_INCLUDED_MAX_LENGTH).optional(),
})

export const updateListingSchema = createListingSchema.partial()

// ----- COMMENT SCHEMAS -----

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(500, 'Comment must be under 500 characters'),
  parentId: z.string().optional(),
})

export const editCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(500, 'Comment must be under 500 characters'),
})

// ----- MESSAGE SCHEMAS -----

export const messageAttachmentSchema = z.object({
  key: z.string().min(1, 'Attachment key is required'),
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().min(1).max(MESSAGE_LIMITS.MAX_ATTACHMENT_SIZE),
  mimeType: z.string().min(1, 'MIME type is required'),
})

export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(MESSAGE_LIMITS.MAX_CONTENT_LENGTH, 'Message is too long'),
  receiverId: z.string().min(1, 'Recipient is required'),
  listingId: z.string().optional(),
  attachments: z
    .array(messageAttachmentSchema)
    .max(MESSAGE_LIMITS.MAX_ATTACHMENTS, `Maximum ${MESSAGE_LIMITS.MAX_ATTACHMENTS} attachments allowed`)
    .optional(),
})

// ----- REPORT SCHEMAS -----

export const createReportSchema = z.object({
  entityType: z.enum(['LISTING', 'COMMENT', 'USER', 'MESSAGE']),
  reason: z.enum([
    'SPAM',
    'STOLEN_CODE',
    'MISLEADING',
    'SCAM',
    'MALWARE',
    'HARASSMENT',
    'ILLEGAL',
    'COPYRIGHT',
    'OTHER',
  ]),
  details: z.string().max(1000).optional(),
  listingId: z.string().optional(),
  commentId: z.string().optional(),
  userId: z.string().optional(),
})

// ----- SEARCH SCHEMAS -----

export const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  priceType: z.enum(['FREE', 'FIXED', 'PAY_WHAT_YOU_WANT', 'CONTACT', 'ALL']).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  techStack: z.array(z.string()).optional(),
  sort: z.enum(['newest', 'oldest', 'price_asc', 'price_desc', 'top']).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
})

// ----- TYPE EXPORTS -----

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type CreateListingInput = z.infer<typeof createListingSchema>
export type UpdateListingInput = z.infer<typeof updateListingSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type EditCommentInput = z.infer<typeof editCommentSchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type CreateReportInput = z.infer<typeof createReportSchema>
export type SearchInput = z.infer<typeof searchSchema>
