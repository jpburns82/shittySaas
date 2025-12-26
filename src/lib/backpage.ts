// ============================================
// バックページ (BackPage) - Helper Functions
// Weekly community board that resets every Monday
// ============================================

// Character limits
export const BACKPAGE_LIMITS = {
  TITLE_MIN: 3,
  TITLE_MAX: 100,
  BODY_MIN: 10,
  BODY_MAX: 5000,
  REPLY_MIN: 2,
  REPLY_MAX: 2000,
  POSTS_PER_PAGE: 20,
  POSTS_PER_DAY: 1,
} as const

// Category display labels
export const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: 'General',
  SHOW_TELL: 'Show & Tell',
  LOOKING_FOR: 'Looking For',
  HELP: 'Help',
}

// Valid categories for validation
export const VALID_CATEGORIES = ['GENERAL', 'SHOW_TELL', 'LOOKING_FOR', 'HELP'] as const

/**
 * Calculate next Monday 00:00 UTC for post expiration
 * Posts created on any day will expire at the start of the next Monday
 */
export function getNextMonday(): Date {
  const now = new Date()
  const dayOfWeek = now.getUTCDay() // 0 = Sunday, 1 = Monday, etc.

  // Calculate days until next Monday
  // If today is Sunday (0), next Monday is 1 day away
  // If today is Monday (1), next Monday is 7 days away
  // If today is Tuesday (2), next Monday is 6 days away, etc.
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek

  const nextMonday = new Date(now)
  nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday)
  nextMonday.setUTCHours(0, 0, 0, 0)

  return nextMonday
}

/**
 * Generate a unique URL-friendly slug from title
 * Includes timestamp suffix to prevent collisions
 */
export function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dashes
      .replace(/^-|-$/g, '') // Trim leading/trailing dashes
      .slice(0, 50) + // Limit length
    '-' +
    Date.now().toString(36) // Add timestamp for uniqueness
  )
}

/**
 * Calculate time remaining until next Monday reset
 * Returns human-readable string
 */
export function getTimeUntilReset(): string {
  const now = new Date()
  const nextMonday = getNextMonday()
  const diffMs = nextMonday.getTime() - now.getTime()

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }
  return `${days} day${days !== 1 ? 's' : ''}`
}

/**
 * Check if a post has expired
 */
export function isExpired(expiresAt: Date): boolean {
  return new Date(expiresAt) < new Date()
}
