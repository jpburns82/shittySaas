# Changelog

All notable changes to UndeadList are documented here.

---

## Phase 7: Admin Expansion (December 2025)

### Added
- **Admin Users Management** - Search, filter, warn, ban, and toggle admin status for users
- **Admin Reports Page** - View, filter, and take action on community reports
- **Featured Listings** - Admin manual control (7/14/30 days or indefinite)
- **Paid Featured Promotion** - Sellers can self-promote at $19.99/week via Stripe
- **Featured Sorting** - Featured listings appear first in browse/search
- **Cron Job** - Vercel cron for automatic featured listing expiration

---

## Phase 6: Account & Settings (December 2025)

### Added
- **Password Change** - API and form with validation
- **Account Deletion** - Soft delete with data anonymization
- **Block Deleted Users** - Prevent deleted accounts from logging in
- **Neon Serverless Adapter** - @prisma/adapter-neon for improved database connectivity

---

## Phase 5: Community Features (December 2025)

### Added
- **Voting System** - ⚡ Reanimate (upvote) / ⚰️ Bury (downvote)
- **Vote Buttons** - Neon glow effects on hover and active states
- **useVote Hook** - Optimistic updates with rollback on error
- **Comments API** - Full CRUD at `/api/listings/[id]/comments`
- **Threaded Comments** - 3-level depth with reply support
- **Comment Composer** - 500 character limit with real-time counter
- **Comment Badges** - OP (green glow), Verified Purchase, Seller
- **Edit Window** - 15-minute edit window for comments
- **Report Comments** - Modal for reporting inappropriate comments

---

## Phase 4: Communication (December 2025)

### Added
- **Direct Messaging** - Buyer/seller messaging system
- **Message Inbox** - Conversation list with unread indicators
- **Message Thread** - Full conversation view with attachments
- **Message Attachments** - File upload to R2 (5MB limit, 3 max)
- **Contact Seller** - Button on listing pages
- **Notification Preferences** - Instant, digest, or off
- **User Blocking** - Block/unblock users from messaging
- **Admin Warn User** - Issue warnings to users in threads
- **Admin Suspend Thread** - Suspend problematic conversations

---

## Phase 3: Payments (December 2025)

### Added
- **Stripe Connect** - Seller onboarding with Express accounts
- **Checkout Sessions** - Stripe-hosted payment flow
- **Webhook Handling** - checkout.session.completed, account.updated, payment failures
- **Platform Fees** - Tiered structure (10% under $100, 8% $100-$1000, 5% over $1000)
- **File Delivery** - Presigned R2 URLs for downloads
- **Purchase Emails** - Buyer confirmation and seller notification
- **Seller Dashboard** - Sales history and payout information
- **Buyer Dashboard** - Purchase history and downloads
- **Stripe CLI** - Local webhook testing configured

---

## Phase 2: Listings Core (December 2025)

### Added
- **Create Listing Form** - All fields with validation
- **File Upload** - R2 storage for listing files (100MB limit)
- **Screenshot Upload** - Up to 5 images per listing
- **Listing Detail Page** - Full product page with SEO
- **Browse Listings** - Grid view with pagination
- **Category Filtering** - Filter by SaaS, Extensions, APIs, etc.
- **Search** - Basic keyword search
- **Seller Profile** - Public profile page with listings

---

## Phase 1: Foundation (December 2025)

### Added
- **Project Setup** - Next.js 15, TypeScript, Tailwind CSS v4
- **Database** - PostgreSQL with Prisma ORM
- **Authentication** - Auth.js (NextAuth v5) with credentials
- **User Registration** - Email/password with verification
- **Email Verification** - Resend integration
- **Basic Layout** - Header, footer, navigation
- **Homepage** - Featured listings, latest listings, categories
- **Dark Theme** - Tokyo Underground aesthetic with neon accents

### Fixed
- R2 exports and validation functions
- Stripe parameter naming (priceInCents)
- Email function signatures
- Schema import names
- Admin role checks (isAdmin boolean)
- Listing status enums (DRAFT, not PENDING)
- All TypeScript errors resolved

---

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Prisma with @prisma/adapter-neon
- **Auth**: Auth.js (NextAuth v5)
- **Payments**: Stripe Connect
- **File Storage**: Cloudflare R2
- **Styling**: Tailwind CSS v4
- **Email**: Resend
