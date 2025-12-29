# UndeadList - Golden Anchor (Source of Truth)

Generated: 2025-12-28

This document is the authoritative reference for what features exist in the codebase.

---

## VERIFIED BUILT

### Authentication
- [x] Email/password login (NextAuth Credentials provider)
- [x] JWT sessions with user metadata (id, username, isAdmin, isVerifiedSeller, stripeOnboarded)
- [x] Admin role (isAdmin boolean)
- [x] Verified seller flag (isVerifiedSeller boolean)
- [x] Email verification system (token sent on registration)
- [x] Password reset flow (1-hour token expiration)
- [x] Last login timestamp tracking
- [x] Protection against deleted/banned users logging in

**Files:**
- src/lib/auth.ts
- src/app/api/auth/register/route.ts
- src/app/api/auth/forgot-password/route.ts
- src/app/api/auth/reset-password/route.ts

---

### Stripe Integration
- [x] Connect onboarding (Express accounts)
- [x] Account link generation for seller onboarding
- [x] Account status tracking (stripeOnboarded, stripePayoutsEnabled)
- [x] Dashboard link creation for sellers
- [x] Checkout sessions with application fees
- [x] Platform fee calculation and deduction

**Platform Fees (Tiered 2-6%):**
| Price Range | Fee |
|-------------|-----|
| Under $25 | 2% |
| $25 - $100 | 3% |
| $100 - $500 | 4% |
| $500 - $2,000 | 5% |
| $2,000+ | 6% |
| Minimum | $0.50 |

- [x] Webhook handling:
  - checkout.session.completed
  - account.updated
  - payment_intent.payment_failed
- [x] Refund capability
- [x] Balance retrieval per seller account
- [x] Payout history retrieval

**Files:**
- src/lib/stripe.ts
- src/lib/fees.ts
- src/app/api/stripe/connect/route.ts
- src/app/api/stripe/checkout/route.ts
- src/app/api/stripe/webhook/route.ts
- src/app/api/stripe/featured-checkout/route.ts

---

### Listings
- [x] Full CRUD operations
- [x] Pagination, filtering, sorting
- [x] Search by title/description/tech stack
- [x] Filter by category, price type, price range
- [x] Sort by: newest, oldest, price (low/high), popularity
- [x] View count tracking
- [x] Featured listings with expiration

**Pricing Types:**
- FIXED
- FREE
- PAY_WHAT_YOU_WANT
- CONTACT

**What's Included Options:**
- Source code
- Database
- Documentation
- Deploy guide
- Support
- Updates
- Commercial license
- White label

**Delivery Methods:**
- INSTANT_DOWNLOAD
- REPOSITORY_ACCESS
- MANUAL_TRANSFER
- DOMAIN_TRANSFER

**Statuses:**
- DRAFT
- ACTIVE
- SOLD
- ARCHIVED
- REMOVED

**Files:**
- src/app/api/listings/route.ts (GET/POST)
- src/app/api/listings/[id]/route.ts (GET/PUT/DELETE)
- src/app/api/listings/[id]/files/route.ts
- src/app/api/listings/my/route.ts

---

### Purchases
- [x] Checkout flow
- [x] Guest checkout support (via email)
- [x] Logged-in user checkout
- [x] Download access (presigned URLs, 24h expiry)
- [x] Purchase history

**Delivery Status Tracking:**
- PENDING (awaiting delivery)
- DELIVERED (seller marked)
- CONFIRMED (buyer confirmed)
- AUTO_COMPLETED (auto-complete after X days)

**Purchase Status:**
- PENDING
- COMPLETED
- FAILED
- REFUNDED
- DISPUTED

**Files:**
- src/app/api/download/[purchaseId]/route.ts
- src/app/api/downloads/[purchaseId]/[fileId]/route.ts

---

### Messaging
- [x] Direct messages between users
- [x] Thread-based conversations (MessageThread model)
- [x] Buyer/seller role tracking in threads
- [x] Context linking to listings
- [x] Message read tracking (readAt timestamp)
- [x] Attachments with file metadata
  - Max 3 attachments per message
  - 5MB limit per attachment
  - Types: PNG, JPEG, GIF, WEBP, PDF, TXT, DOCX
- [x] Thread status: ACTIVE, SUSPENDED, ARCHIVED
- [x] Admin can suspend threads
- [x] User blocking (bidirectional)

**Files:**
- src/app/api/messages/route.ts
- src/app/api/messages/upload/route.ts
- src/app/api/messages/attachments/[attachmentId]/download/route.ts
- src/app/api/admin/messages/[threadId]/suspend/route.ts

---

### Community Features

**Voting:**
- [x] Upvote/downvote per user per listing
- [x] Verified purchase badge on votes
- [x] Denormalized stats: upvoteCount, downvoteCount, voteScore
- [x] Can't vote on own listing

**Comments:**
- [x] Nested comments (one level replies)
- [x] Verified purchase badges
- [x] Seller comment identification
- [x] Edit window (15 minutes)
- [x] Seller can hide comments
- [x] Admin can remove with reason
- [x] Soft-delete support

**Reporting:**
- [x] Entity types: LISTING, COMMENT, USER, MESSAGE
- [x] Reasons: SPAM, STOLEN_CODE, MISLEADING, SCAM, MALWARE, HARASSMENT, ILLEGAL, COPYRIGHT, OTHER
- [x] Status: PENDING, REVIEWED, ACTION_TAKEN, DISMISSED
- [x] Admin resolution notes

**Files:**
- src/app/api/listings/[id]/vote/route.ts
- src/app/api/listings/[id]/comments/route.ts
- src/app/api/reports/route.ts

---

### Admin Panel
- [x] Dashboard with platform stats
- [x] User management (ban/unban, warn, grant admin)
- [x] Search users with filters (status, role, Stripe connected)
- [x] User warning system with reasons:
  - INAPPROPRIATE
  - HARASSMENT
  - SCAM
  - POLICY_VIOLATION
  - OTHER
- [x] Listing management
- [x] Reports queue with filtering
- [x] Audit log (all admin actions tracked)
- [x] Feature/unfeature listings

**Files:**
- src/app/admin/* (all admin pages)
- src/app/api/admin/users/route.ts
- src/app/api/admin/users/[userId]/ban/route.ts
- src/app/api/admin/users/[userId]/warn/route.ts
- src/app/api/admin/reports/route.ts

---

### Email Notifications (Resend)
- [x] Email verification
- [x] Password reset
- [x] Account deletion confirmation
- [x] Purchase confirmation (with download link)
- [x] Sale notification for sellers
- [x] Featured listing confirmation
- [x] New message notification

**Notification Preferences:**
- instant
- digest
- off

**Files:**
- src/lib/email.ts

---

### File Storage (Cloudflare R2)
- [x] S3-compatible client
- [x] Upload with MIME type
- [x] Delete files
- [x] Presigned upload URLs (1hr expiry)
- [x] Presigned download URLs (1hr-24hr expiry)
- [x] Public URL generation
- [x] File type validation per category
- [x] File size limits:
  - Avatars: 2MB
  - Screenshots: 5MB
  - Message attachments: 5MB
  - Listing delivery files: 50MB

**Files:**
- src/lib/r2.ts

---

### SEO
- [x] Dynamic sitemap generation (sitemap.ts)
- [x] Robots.txt (robots.ts)
- [x] Disallows: /dashboard, /admin, /api, /sell, /download

---

### Legal Pages
- [x] About (/about)
- [x] FAQ (/faq)
- [x] Contact (/contact)
- [x] Terms (/terms)
- [x] Privacy (/privacy)

---

### Other Features
- [x] Resources page with Gemini AI customization
- [x] User profile pages (/user/[username])
- [x] Categories with slugs, descriptions, icons
- [x] Smart listing deletion (soft delete if purchases exist)

---

### Escrow/Buyer Protection
- [x] True escrow with tiered holding periods
- [x] escrowStatus field on Purchase (HOLDING, RELEASED, DISPUTED, REFUNDED)
- [x] escrowExpiresAt field with automatic calculation
- [x] Dispute workflow with admin resolution
- [x] Funds held via Stripe payment intents
- [x] Auto-release cron job (`/api/cron/process-escrow`)

**Escrow Duration Rules:**
| Condition | Duration |
|-----------|----------|
| Instant DL + Verified Seller + Clean Scan | Instant release |
| Instant DL + Verified Seller + Unclean | 24 hours |
| Instant DL + New Seller OR Repository Access | 72 hours |
| Manual Transfer | 7 days |
| Domain Transfer | 14 days |

**Files:**
- src/lib/escrow.ts
- src/lib/stripe-transfers.ts
- src/app/api/cron/process-escrow/route.ts
- src/app/api/purchases/[purchaseId]/dispute/route.ts

---

### VirusTotal Integration
- [x] Hash checking (instant, no quota cost)
- [x] File upload scanning for unknown files
- [x] scanStatus field on ListingFile (PENDING, CLEAN, SUSPICIOUS, MALICIOUS, ERROR)
- [x] fileHash field (SHA-256)
- [x] Scan processing cron (`/api/cron/process-scans`)
- [x] Malware detection alerts via SMS/email

**Files:**
- src/lib/virustotal.ts
- src/app/api/cron/process-scans/route.ts

---

### Rate Limiting & Abuse Prevention
- [x] Seller listing limits by tier (1/3/10/unlimited)
- [x] Download limits per purchase (10 downloads)
- [x] Buyer daily spend limits ($50-$1000 by tier)
- [x] Request rate limiting via Upstash Redis
- [x] Auth endpoint protection (5 requests/hour)
- [x] Password reset protection (10 requests/hour)

**Files:**
- src/lib/rate-limit.ts
- src/lib/seller-limits.ts
- src/lib/buyer-limits.ts
- src/lib/download-limiter.ts

---

### Trust System
- [x] Seller tiers: NEW → VERIFIED → TRUSTED → PRO
- [x] Buyer tiers: NEW → VERIFIED → TRUSTED
- [x] Automated tier upgrades based on transactions
- [x] Trust badges in UI
- [x] Tier-based escrow duration calculation

**Seller Tier Thresholds:**
| Tier | Sales Required | Listing Limit |
|------|---------------|---------------|
| NEW | 0 | 1 |
| VERIFIED | 1+ | 3 |
| TRUSTED | 3+ | 10 |
| PRO | 10+ (or manual) | Unlimited |

**Buyer Tier Thresholds:**
| Tier | Purchases | Daily Limit |
|------|-----------|-------------|
| NEW | 0 | $250 |
| VERIFIED | 1+ | $500 |
| TRUSTED | 3+ | $1,000 |
| Guest | N/A | $50 |

**Files:**
- src/lib/seller-limits.ts
- src/lib/buyer-limits.ts

---

### External Integrations
- [x] Twilio SMS alerts (with email fallback)
- [x] GitHub OAuth for seller verification
- [x] GitHub repo ownership verification
- [x] Sentry error tracking
- [x] Upstash Redis for rate limiting

**Files:**
- src/lib/twilio.ts
- src/lib/github.ts
- src/app/api/auth/github/route.ts
- src/app/api/auth/github/callback/route.ts

---

### BackPage Community Board (バックページ)
- [x] Weekly ephemeral posts (expire every Monday)
- [x] Categories: GENERAL, SHOW_TELL, LOOKING_FOR, HELP
- [x] Voting on posts and replies
- [x] Threaded replies
- [x] Report system (SPAM, HARASSMENT, SCAM, OFF_TOPIC, OTHER)
- [x] Admin moderation controls
- [x] Cleanup cron job

**Files:**
- src/lib/backpage.ts
- src/app/api/backpage/* (14 routes)
- src/app/api/admin/backpage/*
- src/app/api/cron/cleanup-backpage/route.ts

---

### Security Features
- [x] CSRF protection (double-submit cookies)
- [x] CSP headers (Content Security Policy)
- [x] HSTS, X-Frame-Options, Permissions-Policy
- [x] Guest JWT authentication for downloads
- [x] Timing-safe string comparisons
- [x] Input validation with Zod
- [x] File type and size validation

**Files:**
- src/lib/csrf.ts
- src/lib/download-token.ts
- next.config.ts (security headers)
- src/middleware.ts

---

### Cron Jobs
- [x] `/api/cron/process-escrow` - Release held escrow
- [x] `/api/cron/cleanup-pending` - Clean stale PENDING purchases
- [x] `/api/cron/expire-featured` - Expire featured listings
- [x] `/api/cron/process-scans` - Poll VirusTotal results
- [x] `/api/cron/cleanup-backpage` - Delete expired BackPage posts

---

## NOT YET BUILT

### Pending Features
- [ ] Guardian AI content moderation (schema fields exist, no implementation)
- [ ] Discord webhook notifications
- [ ] Two-factor authentication
- [ ] Chargeback webhook handler
- [ ] Plausible analytics integration (env var exists, not integrated)

---

## ENVIRONMENT VARIABLES

```env
# Database
DATABASE_URL

# NextAuth
NEXTAUTH_URL
NEXTAUTH_SECRET

# Stripe
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET

# Cloudflare R2
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_URL
NEXT_PUBLIC_R2_PUBLIC_URL

# Email
RESEND_API_KEY

# AI
GOOGLE_GEMINI_API_KEY

# App
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_APP_NAME
ADMIN_EMAIL

# Twilio SMS (optional - falls back to email)
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
ADMIN_PHONE_NUMBER

# VirusTotal
VIRUSTOTAL_API_KEY

# Cron Security
CRON_SECRET

# GitHub OAuth
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET

# Rate Limiting
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN

# Error Tracking
SENTRY_DSN
SENTRY_AUTH_TOKEN
```

---

## DATABASE MODELS (21 Core)

1. User
2. Listing
3. ListingFile
4. ListingView
5. Category
6. Purchase
7. FeaturedPurchase
8. Message
9. MessageThread
10. MessageAttachment
11. Vote
12. Comment
13. Report
14. UserWarning
15. BlockedUser
16. AuditLog
17. VerificationToken
18. BackPagePost
19. BackPageReply
20. BackPageVote
21. BackPageReport

---

## STATISTICS

- **Total Pages:** 40+ page.tsx files
- **Total Components:** 50+ component files
- **API Routes:** 85 endpoints
- **Email Templates:** 12 types
- **Cron Jobs:** 5
- **Lib Modules:** 18
