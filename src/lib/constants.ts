// ===========================================
// UndeadList — App Constants & Configuration
// "Where dead code gets a second life"
// ===========================================

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'UndeadList'
export const APP_TAGLINE = 'Where dead code gets a second life'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Japanese accent text for UI decoration
export const JP_ACCENTS = {
  RESURRECTION: '蘇生',      // Resurrection (logo accent)
  GRAVEYARD: '墓場',         // Graveyard (section headers)
  NOTHING_HERE: '何もない',  // Nothing here (empty states)
  MARKET_OF_DEAD: '死者の市場', // Market of the Dead (footer)
  REVIVAL: '復活',           // Revival (featured badge)
  LOADING: '読込中...',      // Loading...
  LOST: '迷子',              // Lost (404 page)
  COMPLETE: '完了',          // Complete (success toast)
} as const

// ----- PRICING -----

// Platform fee percentage tiers (based on sale price)
export const PLATFORM_FEES = {
  TIER_1: { maxPrice: 10000, feePercent: 10 },   // $0-$100: 10%
  TIER_2: { maxPrice: 100000, feePercent: 8 },   // $100-$1000: 8%
  TIER_3: { maxPrice: Infinity, feePercent: 5 }, // $1000+: 5%
} as const

// Calculate platform fee for a given price (in cents)
export function calculatePlatformFee(priceInCents: number): number {
  let feePercent: number
  
  if (priceInCents <= PLATFORM_FEES.TIER_1.maxPrice) {
    feePercent = PLATFORM_FEES.TIER_1.feePercent
  } else if (priceInCents <= PLATFORM_FEES.TIER_2.maxPrice) {
    feePercent = PLATFORM_FEES.TIER_2.feePercent
  } else {
    feePercent = PLATFORM_FEES.TIER_3.feePercent
  }
  
  return Math.round(priceInCents * (feePercent / 100))
}

// Featured listing price (in cents)
export const FEATURED_LISTING_PRICE = 1999 // $19.99/week

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
  'React Native', 'Expo', 'Flutter', 'Swift', 'Kotlin',
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
  TWITTER: 'https://twitter.com/undeadlist',
  GITHUB: 'https://github.com/undeadlist',
  DISCORD: 'https://discord.gg/undeadlist',
  ESCROW_SERVICE: 'https://escrow.com', // For high-value transfers
} as const

// ----- SEO -----

export const SEO = {
  DEFAULT_TITLE: 'UndeadList — Where Dead Code Gets a Second Life',
  DEFAULT_DESCRIPTION: 'The graveyard marketplace for abandoned software. Buy and sell dead SaaS, scripts, boilerplates, and side projects. Resurrect. Reanimate. Respawn.',
  OG_IMAGE: '/og-image.png',
} as const

// ----- COMMENT SYSTEM -----

export const COMMENT_LIMITS = {
  MAX_CONTENT_LENGTH: 500,
  MAX_REPORT_DETAILS_LENGTH: 300,
  EDIT_WINDOW_MINUTES: 15,
  MAX_THREAD_DEPTH: 3,
} as const
