# Changelog

All notable changes to UndeadList are documented here.

---

## December 28, 2025 - Production Fixes & Documentation Update

### Fixed
- **Guest Downloads** - Download API now accepts JWT tokens for guest authentication (was returning 401)
- **Free Claim Routing** - Guest checkout form now correctly routes FREE items to `/api/purchases/claim` instead of Stripe
- **Download Links in Emails** - Purchase confirmation emails now include JWT-authenticated download URL for guests

### Security
- Guest download API accepts JWT tokens alongside sessions
- Download page passes token to all file download links
- Verified all 85 API routes are functional

### Documentation
- **GOLDEN_ANCHOR.md** - Complete rewrite: moved 8 features from "NOT YET BUILT" to "VERIFIED BUILT"
- **CLAUDE.md** - Updated tech stack versions, phase statuses, working directory
- **CHANGELOG.md** - Added this entry, fixed Phase 3 fee structure error
- **README.md** - Added missing features (BackPage, rate limiting, error tracking)

### Files Modified
- `src/app/api/downloads/[purchaseId]/[fileId]/route.ts`
- `src/app/download/[purchaseId]/page.tsx`
- `src/app/api/stripe/webhook/route.ts`
- `src/app/api/purchases/claim/route.ts`
- `src/components/payments/guest-checkout-form.tsx`

---

## Phase 9: Blind Audit & UI Polish (December 21, 2025)

### Added
- **Blind Audit Report** - Comprehensive code audit (`blind-audit-report.md`)
- **SEO Files** - `robots.ts` and `sitemap.ts` for search engine optimization
- **Stripe Sync Endpoint** - `/api/stripe/sync-status` for manual status sync
- **Featured Email** - `sendFeaturedConfirmationEmail()` function

### Fixed
- **Modal Backgrounds** - Changed from transparent `bg-bg-secondary` to solid `bg-zinc-900`
- **Category Filter** - Custom dropdown with Lucide icons (native select can't render components)
- **Skeleton Loaders** - Changed from `bg-btn-bg` to visible `bg-zinc-800`
- **Modal Headers** - Consistent `bg-zinc-800` styling
- **Seller Avatar Fallback** - Fixed in listing-detail.tsx

### Changed
- **Button Styling** - Proper variants (primary/secondary/danger/neutral)
- **Comment Styling** - Improved visual consistency
- **Vote Hook** - Performance optimizations
- **API Routes** - Strengthened validations
- **Webhook Processing** - Enhanced error handling

### Documentation
- **README.md** - Updated environment variables section
- **CHANGELOG.md** - Added audit summary
- **.env.example** - Documented `CRON_SECRET` as required

### Audit Summary
All 13 major feature areas verified working:
1. Authentication (register, login, verify, password reset)
2. User Management (profile, settings, avatar, delete)
3. Stripe Integration (Connect, checkout, webhooks, payouts)
4. Listings System (CRUD, states, file uploads)
5. Search & Discovery (browse, search, category, filters)
6. Voting System (upvote/downvote with icons)
7. Comments/Forum (threading, edit window, moderation)
8. Messaging System (threads, attachments, blocking)
9. Admin System (dashboard, users, listings, reports, audit log)
10. Purchases & Downloads (flow, delivery, history)
11. Resources/Help (templates, AI customization)
12. Legal Pages (about, faq, terms, privacy, contact)
13. SEO (sitemap, robots, metadata)

**Issues Identified:** 2 HIGH, 1 MEDIUM priority (see blind-audit-report.md)

---

## Phase 8: Legal, Resources & Fee Refactor (December 2025)

### Added
- **Terms of Service** - `/terms` page with full legal text
- **Privacy Policy** - `/privacy` page with data handling policies
- **FAQ Page** - `/faq` with accordion-style Q&A
- **About Page** - `/about` with company information and mission
- **Contact Page** - `/contact` with contact details and information
- **Resources Page** - `/resources` with guides and documentation
- **Accordion Component** - Reusable collapsible sections with animation
- **CopyButton Component** - One-click copy with "Copied!" feedback
- **Partner Images** - Acquire, Escrow, GitHub, Loom assets for resources page
- **Audit Log Feature** - Admin action tracking (late Phase 7 addition)
- **Password Reset Flow** - Forgot password + reset with Resend email

### UI Polish
- **Vote Buttons** - Fixed hardcoded colors, now uses CSS variables
- **Message Bubble** - Fixed hardcoded colors for consistent theming
- **Image Gallery** - Fixed hardcoded colors, uses CSS variables
- **Sidebar** - Replaced emoji icons with Lucide React icons
- **Admin Pages** - Fixed filter button styling, green to cyan consistency
- **Accessibility** - Added aria-labels across components
- **Hero/Footer Logos** - Added neon glow effects

### Changed
- **Platform Fees** - New 5-tier structure with $0.50 minimum:
  - Under $25: 2%
  - $25-$100: 3%
  - $100-$500: 4%
  - $500-$2,000: 5%
  - $2,000+: 6%
- **Fee Module** - Moved from `constants.ts` to dedicated `fees.ts`
- **Footer Navigation** - About link changed to Resources
- **Legal Layout** - New shared layout with prose styling

---

## Phase 7.5: Image Upload System (December 2025)

### Added
- **ImageUpload Component** - Drag-drop multi-file uploader with preview
- **ImageGallery Component** - Lightbox with keyboard navigation
- **Avatar Upload API** - `/api/user/avatar` with R2 storage
- **Screenshot Upload API** - `/api/listings/screenshots` endpoint
- **Settings Page Enhancement** - Avatar upload integrated
- **R2 Cleanup** - Auto-delete images when listings/images removed

### Changed
- **Listing Detail** - Now uses ImageGallery for screenshots with lightbox
- **Listing Form** - Integrated ImageUpload for thumbnails/screenshots
- **Listing Card** - Updated with vote count display
- **Seed Data** - Added avatar URLs and thumbnail paths
- **Hero Section** - Redesigned with new logo layout

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
- **Platform Fees** - Tiered structure (2-6% based on sale price, $0.50 minimum)
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
