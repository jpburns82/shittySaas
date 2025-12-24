// ===========================================
// UndeadList — App Constants & Configuration
// "Built, but undiscovered."
// ===========================================

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'UndeadList'
export const APP_TAGLINE = 'Built, but undiscovered. Buy and sell independent software projects that haven\'t found their audience yet — SaaS apps, scripts, boilerplates, and more.'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Japanese accent text for UI decoration
export const JP_ACCENTS = {
  RESURRECTION: '蘇生',      // Resurrection (logo accent)
  GRAVEYARD: '墓場',         // Graveyard (section headers)
  TAGLINE: '作られた。でも、まだ見つかっていない。', // Built, but undiscovered.
  NOTHING_HERE: '何もない',  // Nothing here (empty states)
  MARKET_TAGLINE: 'コードのためのフリーマーケット', // Flea market for code (footer)
  REVIVAL: '復活',           // Revival (featured badge)
  LOADING: '読込中...',      // Loading...
  LOST: '迷子',              // Lost (404 page)
  COMPLETE: '完了',          // Complete (success toast)
  FORUM: 'アンデッドリストフォーラム', // UndeadList Forum
} as const

// ----- PRICING -----

// NOTE: Platform fees have been moved to src/lib/fees.ts
// The new fee structure is: 2% (<$25), 3% ($25-100), 4% ($100-500), 5% ($500-2000), 6% ($2000+)
// with a $0.50 minimum fee. Import from '@/lib/fees' instead.

// Featured listing price (in cents)
export const FEATURED_LISTING_PRICE = 1999 // $19.99/week

// Featured duration options with pricing for seller self-promotion
export const FEATURED_DURATION_OPTIONS = {
  WEEK_1: { days: 7, priceInCents: 1999, label: '1 Week', description: '$19.99' },
  WEEK_2: { days: 14, priceInCents: 3499, label: '2 Weeks', description: '$34.99', badge: 'Popular' },
  MONTH_1: { days: 30, priceInCents: 5999, label: '1 Month', description: '$59.99', badge: 'Best Value' },
} as const

export type FeaturedDurationKey = keyof typeof FEATURED_DURATION_OPTIONS

// ----- LISTINGS -----

export const LISTING_LIMITS = {
  TITLE_MAX_LENGTH: 100,
  SHORT_DESC_MAX_LENGTH: 280,
  DESCRIPTION_MAX_LENGTH: 10000,
  WHATS_INCLUDED_MAX_LENGTH: 2000,
  MAX_SCREENSHOTS: 5,
  MAX_FILE_SIZE_MB: 100,
  MAX_TECH_STACK_TAGS: 10,
} as const

export const PRICE_TYPES = {
  FREE: 'FREE',
  FIXED: 'FIXED',
  PAY_WHAT_YOU_WANT: 'PAY_WHAT_YOU_WANT',
  CONTACT: 'CONTACT',
} as const

export const LISTING_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  ACTIVE: 'ACTIVE',
  SOLD: 'SOLD',
  ARCHIVED: 'ARCHIVED',
  REJECTED: 'REJECTED',
} as const

// ----- TECH STACK TAGS -----
// Common tech stack options for autocomplete
export const TECH_STACK_OPTIONS = [
  // Frontend
  'React', 'Next.js', 'Vue', 'Nuxt', 'Svelte', 'SvelteKit', 'Angular',
  'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'SASS',
  
  // Backend
  'Node.js', 'Express', 'Fastify', 'Hono',
  'Python', 'Django', 'Flask', 'FastAPI',
  'Ruby', 'Rails',
  'Go', 'Rust', 'Java', 'Kotlin', 'PHP', 'Laravel',
  
  // Databases
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite',
  'Supabase', 'Firebase', 'PlanetScale', 'Neon',
  'Prisma', 'Drizzle',
  
  // Infrastructure
  'Vercel', 'Netlify', 'Railway', 'Render', 'Fly.io',
  'AWS', 'GCP', 'Azure', 'DigitalOcean', 'Cloudflare',
  'Docker', 'Kubernetes',
  
  // Mobile
  'React Native', 'Expo', 'Flutter', 'Swift',
  'iOS', 'Android',
  
  // AI/ML
  'OpenAI', 'GPT', 'Claude', 'LangChain', 'Hugging Face',
  'TensorFlow', 'PyTorch',
  
  // Auth
  'Auth.js', 'NextAuth', 'Clerk', 'Auth0', 'Supabase Auth',
  
  // Payments
  'Stripe', 'Paddle', 'LemonSqueezy', 'PayPal',
  
  // Other
  'TypeScript', 'GraphQL', 'REST API', 'WebSocket',
  'Chrome Extension', 'Firefox Extension',
  'Electron', 'Tauri',
] as const

// ----- MESSAGES -----

export const MESSAGE_LIMITS = {
  MAX_CONTENT_LENGTH: 5000,
  MAX_ATTACHMENTS: 3,
  MAX_ATTACHMENT_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_ATTACHMENT_TYPES: [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  ],
} as const

// ----- PAGINATION -----

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,
} as const

// ----- FILE UPLOAD -----

export const ALLOWED_FILE_TYPES = {
  // Archives
  '.zip': 'application/zip',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.tar.gz': 'application/gzip',
  '.rar': 'application/vnd.rar',
  '.7z': 'application/x-7z-compressed',
  
  // Images (for screenshots)
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
} as const

export const ALLOWED_SCREENSHOT_TYPES = ['.png', '.jpg', '.jpeg', '.gif', '.webp']
export const ALLOWED_DELIVERY_TYPES = ['.zip', '.tar', '.gz', '.tar.gz', '.rar', '.7z']

// ----- VALIDATION -----

export const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/
export const SLUG_REGEX = /^[a-z0-9-]+$/

// ----- EXTERNAL LINKS -----

export const EXTERNAL_LINKS = {
  TWITTER: 'https://x.com/undeadlistshop',
  GITHUB: 'https://github.com/undeadlist',
  DISCORD: 'https://discord.gg/undeadlist',
  ESCROW_SERVICE: 'https://escrow.com', // For high-value transfers
} as const

// ----- SEO -----

export const SEO = {
  DEFAULT_TITLE: 'UndeadList — The Indie Software Flea Market | undead list',
  DEFAULT_DESCRIPTION: 'UndeadList (undead list) — The indie software flea market. Buy and sell undiscovered SaaS, scripts, boilerplates, and side projects. No gatekeeping, no minimums.',
  OG_IMAGE: '/og-image.png',
  KEYWORDS: 'undeadlist, undead list, indie software, side projects, buy saas, sell saas, software marketplace, abandoned projects, code marketplace, startup acquisition',
} as const

// ----- COMMENT SYSTEM -----

export const COMMENT_LIMITS = {
  MAX_CONTENT_LENGTH: 500,
  MAX_REPORT_DETAILS_LENGTH: 300,
  EDIT_WINDOW_MINUTES: 15,
  MAX_THREAD_DEPTH: 3,
} as const

// ----- SELLER TIERS -----

export const SELLER_TIER_CONFIG = {
  PRO: { minSales: 10, listingLimit: Infinity, label: 'Pro Seller' },
  TRUSTED: { minSales: 3, listingLimit: 10, label: 'Trusted Seller' },
  VERIFIED: { minSales: 1, listingLimit: 3, label: 'Verified Seller' },
  NEW: { minSales: 0, listingLimit: 1, label: 'New Seller' },
} as const

export type SellerTierKey = keyof typeof SELLER_TIER_CONFIG

// ----- BUYER TIERS -----

export const BUYER_TIER_CONFIG = {
  TRUSTED: { minPurchases: 3, dailySpendLimitCents: 100000, label: 'Trusted Buyer' }, // $1000/day
  VERIFIED: { minPurchases: 1, dailySpendLimitCents: 50000, label: 'Verified Buyer' }, // $500/day
  NEW: { minPurchases: 0, dailySpendLimitCents: 25000, label: 'New Buyer' }, // $250/day
} as const

export const GUEST_DAILY_LIMIT_CENTS = 5000 // $50/day for guests

export type BuyerTierKey = keyof typeof BUYER_TIER_CONFIG

// ----- ESCROW DURATIONS -----

/**
 * Escrow hold durations in hours based on risk factors
 */
export const ESCROW_DURATIONS = {
  INSTANT_RELEASE: 0,
  NEW_SELLER_UNSCANNED: 72,      // 3 days
  VERIFIED_SELLER_UNCLEAN: 24,   // 1 day
  REPOSITORY_ACCESS: 72,          // 3 days
  MANUAL_TRANSFER: 168,           // 7 days
  DOMAIN_TRANSFER: 336,           // 14 days
  DEFAULT: 72,                    // 3 days
} as const
