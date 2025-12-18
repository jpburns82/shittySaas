# UndeadList — Project Roadmap

> Where dead code gets a second life. A dark-themed marketplace with Tokyo underground aesthetics where indie developers buy and sell abandoned projects, SaaS apps, scripts, and side projects.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Database Schema](#database-schema)
4. [Setup Instructions](#setup-instructions)
5. [Development Phases](#development-phases)
6. [Design System (Retro Aesthetic)](#design-system-retro-aesthetic)
7. [Deployment](#deployment)

---

## Tech Stack

### Core

| Layer | Technology | Why |
|-------|------------|-----|
| Framework | Next.js 15 (App Router) | Full-stack, React 19, server components |
| Language | TypeScript | Type safety, better DX |
| Database | PostgreSQL | Reliable, you know it |
| ORM | Prisma | Type-safe queries, easy migrations |
| Auth | Auth.js (NextAuth v5) | Simple, extensible |
| Payments | Stripe Connect (Express) | Handles splits, payouts, everything |
| File Storage | Cloudflare R2 | S3-compatible, cheap, fast |
| Styling | Tailwind CSS v4 | Utility-first, customizable for retro look |
| Hosting | Vercel | Zero-config Next.js deploys |
| Database Host | Neon / Supabase / Railway | Serverless Postgres options |

### Supporting

| Purpose | Technology |
|---------|------------|
| Email | Resend |
| Image Optimization | Next.js built-in + Cloudflare |
| Rate Limiting | Upstash Redis |
| Search (later) | Meilisearch or Postgres full-text |
| Analytics | Plausible or Umami (privacy-first) |

---

## Project Structure

```
undeadlist/
├── .env.local                    # Local environment variables
├── .env.example                  # Template for env vars
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Migration history
│   └── seed.ts                   # Seed data for dev
├── public/
│   ├── fonts/                    # Retro fonts (VT323, IBM Plex, etc.)
│   ├── images/
│   │   ├── logo.svg
│   │   ├── og-image.png          # Social preview
│   │   └── placeholder.png       # Default listing image
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Homepage (listing feed)
│   │   ├── globals.css           # Global styles + retro theme
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── verify/
│   │   │       └── page.tsx
│   │   ├── (browse)/
│   │   │   ├── listings/
│   │   │   │   └── page.tsx      # Browse all listings
│   │   │   ├── category/
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx  # Category view
│   │   │   └── search/
│   │   │       └── page.tsx      # Search results
│   │   ├── listing/
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Listing detail page
│   │   │       └── purchase/
│   │   │           └── page.tsx  # Purchase flow
│   │   ├── sell/
│   │   │   ├── page.tsx          # Create listing form
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx  # Edit listing
│   │   ├── dashboard/
│   │   │   ├── page.tsx          # Seller dashboard home
│   │   │   ├── listings/
│   │   │   │   └── page.tsx      # My listings
│   │   │   ├── sales/
│   │   │   │   └── page.tsx      # Sales history
│   │   │   ├── purchases/
│   │   │   │   └── page.tsx      # My purchases
│   │   │   ├── messages/
│   │   │   │   └── page.tsx      # Buyer/seller messages
│   │   │   ├── payouts/
│   │   │   │   └── page.tsx      # Stripe payouts
│   │   │   └── settings/
│   │   │       └── page.tsx      # Account settings
│   │   ├── user/
│   │   │   └── [username]/
│   │   │       └── page.tsx      # Public seller profile
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts  # Auth.js API route
│   │   │   ├── listings/
│   │   │   │   ├── route.ts      # GET all, POST create
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts  # GET one, PUT update, DELETE
│   │   │   ├── upload/
│   │   │   │   └── route.ts      # File upload to R2
│   │   │   ├── stripe/
│   │   │   │   ├── connect/
│   │   │   │   │   └── route.ts  # Onboard seller to Stripe
│   │   │   │   ├── checkout/
│   │   │   │   │   └── route.ts  # Create checkout session
│   │   │   │   └── webhook/
│   │   │   │       └── route.ts  # Stripe webhooks
│   │   │   └── messages/
│   │   │       └── route.ts      # Buyer/seller messaging
│   │   └── admin/
│   │       ├── page.tsx          # Admin dashboard
│   │       └── listings/
│   │           └── page.tsx      # Moderate listings
│   ├── components/
│   │   ├── ui/                   # Base UI components (retro styled)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── select.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── modal.tsx
│   │   │   └── spinner.tsx
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── nav.tsx
│   │   ├── listings/
│   │   │   ├── listing-card.tsx
│   │   │   ├── listing-grid.tsx
│   │   │   ├── listing-form.tsx
│   │   │   ├── listing-detail.tsx
│   │   │   ├── price-badge.tsx
│   │   │   └── tech-stack-tags.tsx
│   │   ├── search/
│   │   │   ├── search-bar.tsx
│   │   │   ├── filters.tsx
│   │   │   └── category-nav.tsx
│   │   ├── payments/
│   │   │   ├── stripe-connect-button.tsx
│   │   │   ├── checkout-button.tsx
│   │   │   └── payout-history.tsx
│   │   └── messages/
│   │       ├── message-thread.tsx
│   │       └── message-input.tsx
│   ├── lib/
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── auth.ts               # Auth.js config
│   │   ├── stripe.ts             # Stripe client + helpers
│   │   ├── r2.ts                 # Cloudflare R2 client
│   │   ├── email.ts              # Resend email helpers
│   │   ├── utils.ts              # General utilities
│   │   └── constants.ts          # App constants, categories, etc.
│   ├── hooks/
│   │   ├── use-listings.ts
│   │   ├── use-messages.ts
│   │   └── use-stripe.ts
│   └── types/
│       ├── listing.ts
│       ├── user.ts
│       └── index.ts
├── scripts/
│   ├── seed-categories.ts        # Seed initial categories
│   └── test-stripe.ts            # Test Stripe integration
└── docs/
    ├── ROADMAP.md                # This file
    ├── API.md                    # API documentation
    └── DEPLOYMENT.md             # Deployment guide
```

---

## Database Schema

The full database schema is in `prisma/schema.prisma`. Key models:

### Core Models

| Model | Purpose |
|-------|---------|
| **User** | Accounts with Stripe Connect, profiles, admin/ban status, soft delete |
| **Listing** | Projects for sale with pricing, tech stack, delivery methods, featured status |
| **ListingFile** | Uploaded files for listings (R2 storage) |
| **Category** | Listing categories |
| **Purchase** | Transaction records with Stripe references, delivery tracking |

### Community Models

| Model | Purpose |
|-------|---------|
| **Vote** | Reanimate (+1) / Bury (-1) votes on listings |
| **Comment** | Threaded comments (3-level depth), 15-min edit window |
| **BlockedUser** | User blocking relationships |

### Messaging Models

| Model | Purpose |
|-------|---------|
| **MessageThread** | Conversation threads between buyer/seller |
| **Message** | Individual messages with read status |
| **MessageAttachment** | File attachments on messages |
| **UserWarning** | Admin warnings issued to users |

### Moderation Models

| Model | Purpose |
|-------|---------|
| **Report** | Community reports for listings/comments/users/messages |
| **AuditLog** | Admin action logging |
| **FeaturedPurchase** | Paid featured listing promotions |
| **ListingView** | Analytics for listing views |

### Enums

```prisma
enum PriceType { FREE, FIXED, PAY_WHAT_YOU_WANT, CONTACT }
enum ListingStatus { DRAFT, ACTIVE, SOLD, ARCHIVED, REMOVED }
enum DeliveryMethod { INSTANT_DOWNLOAD, REPOSITORY_ACCESS, MANUAL_TRANSFER, DOMAIN_TRANSFER }
enum PurchaseStatus { PENDING, COMPLETED, FAILED, REFUNDED, DISPUTED }
enum DeliveryStatus { PENDING, DELIVERED, CONFIRMED, AUTO_COMPLETED }
enum ThreadStatus { ACTIVE, SUSPENDED, ARCHIVED }
enum ReportEntityType { LISTING, COMMENT, USER, MESSAGE }
enum ReportReason { SPAM, STOLEN_CODE, MISLEADING, SCAM, MALWARE, HARASSMENT, ILLEGAL, COPYRIGHT, OTHER }
enum ReportStatus { PENDING, REVIEWED, ACTION_TAKEN, DISMISSED }
enum WarningReason { INAPPROPRIATE, HARASSMENT, SCAM, POLICY_VIOLATION, OTHER }
enum FeaturedStatus { PENDING, ACTIVE, EXPIRED, CANCELLED, REFUNDED }
```

See `prisma/schema.prisma` for the complete schema with all fields and relations.

---

## Setup Instructions

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- PostgreSQL database
- Stripe account
- Cloudflare R2 bucket
- Resend account (for email)

### 1. Create Project

```bash
# Create Next.js project
pnpm create next-app@latest undeadlist --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd undeadlist
```

### 2. Install Dependencies

```bash
# Core
pnpm add @prisma/client @auth/prisma-adapter next-auth@beta
pnpm add stripe @stripe/stripe-js
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
pnpm add resend
pnpm add zod                    # Validation
pnpm add slugify                # URL slugs
pnpm add nanoid                 # ID generation
pnpm add date-fns               # Date formatting
pnpm add clsx tailwind-merge    # Class utilities
pnpm add lucide-react           # Icons

# Dev dependencies
pnpm add -D prisma
pnpm add -D @types/node @types/react

# Optional but recommended
pnpm add -D prettier eslint-config-prettier
```

### 3. Environment Setup

```bash
# Copy example env
cp .env.example .env.local
```

```env
# .env.example

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/undeadlist"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PLATFORM_FEE_PERCENT="10"

# Cloudflare R2
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="undeadlist"
R2_PUBLIC_URL="https://your-bucket.r2.cloudflarestorage.com"

# Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@undeadlist.com"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="UndeadList"
```

### 4. Initialize Prisma

```bash
# Initialize Prisma
pnpm prisma init

# After adding schema, generate client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev --name init

# Seed categories
pnpm prisma db seed
```

### 5. Stripe Setup

1. Create Stripe account at stripe.com
2. Enable Stripe Connect in dashboard
3. Set platform fee percentage
4. Configure webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
5. Listen for events: `checkout.session.completed`, `account.updated`

```bash
# For local development, use Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 6. Run Development

```bash
pnpm dev
```

---

## Development Phases

### Phase 1: Foundation ✅ COMPLETE

- [x] Project setup, dependencies, env config
- [x] Prisma schema + initial migration
- [x] Auth setup (register, login, email verify)
- [x] Basic layout (header, footer, nav)
- [x] Homepage with listings grid and categories
- [x] Bug fixes (Phase 1 fixes applied)
  - [x] R2 exports and validation functions
  - [x] Stripe parameter naming (priceInCents)
  - [x] Email function signatures
  - [x] Schema import names
  - [x] Admin role checks (isAdmin boolean)
  - [x] Listing status enums (DRAFT, not PENDING)
  - [x] All TypeScript errors resolved

**Deliverable:** Can register, login, see homepage with listings

### Phase 2: Listings Core ✅ COMPLETE

- [x] Create listing form (all fields)
- [x] File upload to R2 (API route working)
- [x] Screenshot upload
- [x] Listing detail page
- [x] Browse listings page
- [x] Category filtering
- [x] Search (basic)
- [x] Seller profile page

**Deliverable:** Can create listings, browse, view details

### Phase 3: Payments ✅ COMPLETE

- [x] Stripe Connect onboarding flow
- [x] Checkout session creation
- [x] Webhook handling
- [x] Purchase confirmation (email)
- [x] File delivery (download access with presigned URLs)
- [x] Seller dashboard (sales, payouts)
- [x] Buyer purchases page
- [x] Stripe CLI local testing configured

**Deliverable:** Full purchase flow working, money moves, files delivered

### Phase 4: Communication ✅ COMPLETE

- [x] Buyer → Seller messaging
- [x] Message notifications (email)
- [x] Message inbox UI (conversation list)
- [x] Message thread detail page with attachments
- [x] "Contact seller" on listings
- [x] Message notification preferences (instant/digest/off)
- [x] User blocking functionality (block/unblock via API)
- [x] Admin warn user functionality
- [x] Admin suspend thread functionality

**Deliverable:** Buyers and sellers can communicate

### Phase 5: Community Features ✅ COMPLETE

- [x] Comments CRUD API (`/api/listings/[id]/comments`)
- [x] Comment list component (threaded, 3-level depth)
- [x] Comment composer component (500 char limit)
- [x] Comment item with badges (OP, Verified Purchase, Seller)
- [x] Report comment modal
- [x] 15-minute edit window
- [x] Voting API (`/api/listings/[id]/vote`)
- [x] VoteButtons component with ⚡ Reanimate / ⚰️ Bury
- [x] useVote hook with optimistic updates
- [x] Neon glow effects on vote buttons

**Deliverable:** Threaded comments and voting system complete

### Phase 6: Account & Settings ✅ COMPLETE

- [x] Password change API (`/api/user/password`)
- [x] Password change form with validation
- [x] Account deletion API (`/api/user/delete`)
- [x] Account deletion modal with confirmation
- [x] Soft delete (anonymize data, preserve transaction history)
- [x] Block deleted users from login
- [ ] Listing archive functionality

**Deliverable:** Full account management (archive pending)

### Phase 7: Admin Expansion ✅ COMPLETE

- [x] Admin moderation panel (listings)
- [x] Admin user warning system
- [x] Admin thread suspension
- [x] Admin users management page (search, filter, warn, ban, toggle admin)
- [x] Admin reports page (view, filter, take action on reports)
- [x] Featured listings - admin manual control (7/14/30 days or indefinite)
- [x] Featured listings - paid seller self-promotion ($19.99/week via Stripe)
- [x] Featured listings sorted first in browse/search
- [x] Vercel cron job for featured expiration

**Deliverable:** Complete admin tools and featured listings system

### Phase 7.5: Image Upload System ✅ COMPLETE

- [x] ImageUpload component (drag-drop, multi-file)
- [x] ImageGallery component (lightbox, keyboard nav)
- [x] Avatar upload API (`/api/user/avatar`)
- [x] Screenshot upload API (`/api/listings/screenshots`)
- [x] Avatar integration in settings page
- [x] Listing form image upload integration
- [x] R2 cleanup on image/listing deletion

**Deliverable:** Full image upload system with gallery viewer

### Phase 8: Critical Missing Features 🚧 IN PROGRESS

**Authentication Gaps:**
- [ ] Forgot password page (`/forgot-password`)
- [ ] Reset password page (`/reset-password`)
- [ ] Password reset API (`/api/auth/forgot`, `/api/auth/reset`)

**Payment Gaps:**
- [ ] Pay-what-you-want checkout (API rejects this price type)
- [ ] Guest checkout UI (API supports it, no frontend)

**Delivery Gaps:**
- [ ] File upload UI for sellers (no way to attach deliverables to listings)
- [ ] Manual delivery workflow UI

**Legal Pages:**
- [ ] Terms of Service page (`/terms`)
- [ ] Privacy Policy page (`/privacy`)
- [ ] FAQ/Help page (`/faq`)

**Notifications:**
- [ ] Daily digest email cron job
- [ ] Comment notification emails

**UI Polish:**
- [ ] Archive listing button functionality (button exists, no handler)
- [ ] OpenGraph images for social sharing
- [ ] Mobile responsiveness audit

**Deliverable:** Core marketplace fully functional

### Phase 9: Production Launch 📋 PLANNED

- [ ] Production environment setup (Vercel)
- [ ] Production database (Neon) with connection pooling
- [ ] Production Stripe keys and webhook configuration
- [ ] Production R2 bucket and CORS settings
- [ ] Production Resend domain verification
- [ ] Error monitoring (Sentry)
- [ ] Lighthouse performance audit (target 90+ scores)
- [ ] User flow testing (registration → purchase → delivery)

**Deliverable:** Production-ready launch

### Future (Post-Launch)

- [ ] "Pay what you want" pricing checkout flow
- [x] Featured listing purchases (completed in Phase 7)
- [ ] Seller analytics dashboard
- [ ] Rating/review system
- [ ] Improved search (Meilisearch or Postgres full-text)
- [ ] API for external integrations
- [ ] Auction/bidding format
- [ ] Bundle listings

---

## Design System (Tokyo Underground)

### Inspiration

The vibe is **dark Tokyo underground meets cyberpunk marketplace**. Think:

- Neon-lit alleyways in Shinjuku
- Underground hacker markets
- itch.io's indie feel with a darker edge
- Retro CRT monitors and scan lines
- Japanese arcade aesthetics

**NOT:** Clean corporate SaaS. Not bright and friendly. Not Material Design.

### Core Principles

1. **Dark-first** — Black backgrounds, neon accents
2. **Visible borders** — Things have edges, boxes, outlines
3. **Monospace accents** — Code aesthetic throughout
4. **Neon glow** — Subtle glow effects on interactive elements
5. **Japanese accents** — Kanji characters for atmosphere
6. **Dense but readable** — More content per screen than modern sites

### Color Palette

```css
:root {
  /* Backgrounds - The Crypt */
  --bg-crypt: #0d0d0d;           /* Deep black */
  --bg-grave: #1a1a1a;           /* Dark gray for cards */
  --bg-tombstone: #2a2a2a;       /* Slightly lighter for hover */

  /* Borders */
  --border-crypt: #333333;       /* Subtle dark borders */
  --border-glow: #39ff14;        /* Neon green glow borders */

  /* Text */
  --text-bone: #e8e8e8;          /* Primary text - off-white */
  --text-dust: #888888;          /* Muted text */
  --text-muted: #666666;         /* Even more muted */

  /* Accent - Neon */
  --accent-reanimate: #39ff14;   /* Neon green - primary actions */
  --accent-bury: #ff2d6a;        /* Neon pink - danger/delete */
  --accent-electric: #00d4ff;    /* Cyan - links */

  /* Glow Effects */
  --glow-green: 0 0 10px #39ff14, 0 0 20px #39ff1466;
  --glow-pink: 0 0 10px #ff2d6a;
  --glow-cyan: 0 0 8px #00d4ff;
}
```

### Japanese Accents

Used sparingly for atmosphere (decorative, not replacing English):

| Placement | Text | Meaning |
|-----------|------|---------|
| Logo accent | 蘇生 | "Resurrection" |
| Section headers | 墓場 | "Graveyard" |
| Empty states | 何もない | "Nothing here" |
| Footer | 死者の市場 | "Market of the Dead" |
| Featured badge | 復活 | "Revival" |
| Loading state | 読込中... | "Loading..." |
| Comments section | 墓場 | "WHISPERS FROM THE CRYPT" |

### Typography

```css
:root {
  /* Fonts - import in globals.css */
  --font-body: 'IBM Plex Sans', -apple-system, sans-serif;
  --font-mono: 'IBM Plex Mono', 'Courier New', monospace;
  --font-display: 'VT323', 'IBM Plex Mono', monospace; /* For headers, logo */
  
  /* Sizes - slightly smaller than modern defaults */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.8125rem;  /* 13px */
  --text-base: 0.9375rem;/* 15px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.5rem;     /* 24px */
  --text-2xl: 2rem;      /* 32px */
}
```

**Font imports (add to globals.css or layout):**

```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=VT323&display=swap');
```

### UI Components

#### Buttons

```css
/* Primary button - neon glow */
.btn-primary {
  background: var(--accent-reanimate);
  color: var(--bg-crypt);
  border: none;
  padding: 8px 20px;
  font-family: var(--font-body);
  font-weight: 600;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.btn-primary:hover {
  box-shadow: var(--glow-green);
}

/* Ghost button */
.btn-ghost {
  background: transparent;
  border: 1px solid var(--border-crypt);
  color: var(--text-bone);
  padding: 8px 20px;
}

.btn-ghost:hover {
  border-color: var(--accent-electric);
  color: var(--accent-electric);
}

/* Danger button */
.btn-danger {
  background: var(--accent-bury);
  color: white;
}

.btn-danger:hover {
  box-shadow: var(--glow-pink);
}
```

#### Cards (Listing Cards)

```css
.card {
  background: var(--bg-grave);
  border: 1px solid var(--border-crypt);
  padding: 16px;
}

.card:hover {
  border-color: var(--accent-electric);
}

.card-title {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-bone);
}

.card-price {
  color: var(--accent-reanimate);
  font-weight: 600;
}
```

#### Inputs

```css
input, textarea, select {
  background: var(--bg-crypt);
  border: 1px solid var(--border-crypt);
  color: var(--text-bone);
  padding: 10px 12px;
  font-family: var(--font-body);
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: var(--accent-electric);
  box-shadow: var(--glow-cyan);
}

input::placeholder {
  color: var(--text-dust);
}
```

#### Tables (for dashboard, admin)

```css
table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

th {
  background: var(--bg-grave);
  border: 1px solid var(--border-crypt);
  padding: 12px;
  text-align: left;
  color: var(--text-dust);
  text-transform: uppercase;
  font-size: var(--text-xs);
}

td {
  border-bottom: 1px solid var(--border-crypt);
  padding: 12px;
  color: var(--text-bone);
}

tr:hover {
  background: var(--bg-tombstone);
}
```

### Layout Patterns

#### Header

```
+------------------------------------------------------------------+
| [LOGO] 蘇生 UndeadList      [Browse] [Sell] [Login] [Register]   |
+------------------------------------------------------------------+
| [ Search................................ ] [Go]  [Category ▼]    |
+------------------------------------------------------------------+
```

Simple, dense, functional. No hamburger menu on desktop.

#### Listing Grid (Homepage)

```
+------------------------------------------------------------------+
| CATEGORIES: [All] [SaaS] [Extensions] [Boilerplates] [Scripts]   |
+------------------------------------------------------------------+
| Sort: [Newest ▼]  Filter: [All Prices ▼]     Showing 1-25 of 142 |
+------------------------------------------------------------------+
|                                                                  |
| +------------------------------+  +------------------------------+
| | [img] Title of Project       |  | [img] Another Project        |
| | Short description goes here  |  | Description text here too    |
| | $49 · SaaS · React, Node     |  | FREE · Boilerplate · Next.js |
| | Listed 2 days ago            |  | Listed 5 days ago            |
| +------------------------------+  +------------------------------+
|                                                                  |
| +------------------------------+  +------------------------------+
| | ...                          |  | ...                          |
| +------------------------------+  +------------------------------+
|                                                                  |
|                    [1] [2] [3] [4] [5] ... [Next →]              |
+------------------------------------------------------------------+
```

#### Listing Detail Page

```
+------------------------------------------------------------------+
| ← Back to listings                                               |
+------------------------------------------------------------------+
| PROJECT TITLE HERE                                               |
| by @username · Listed Dec 15, 2025 · 234 views                   |
+------------------------------------------------------------------+
|                                                                  |
| +---------------------------+  +--------------------------------+ |
| |                           |  | PRICE                          | |
| |    [Screenshot 1]         |  | $149 (one-time)                | |
| |                           |  |                                | |
| +---------------------------+  | [    BUY NOW    ]              | |
| [1] [2] [3] thumbnails         |                                | |
|                                | or [Contact Seller]            | |
|                                +--------------------------------+ |
|                                                                  |
| DESCRIPTION                    | TECH STACK                     | |
| -------------------------      | [React] [Node] [PostgreSQL]    | |
| Full markdown description      |                                | |
| goes here with details         | WHAT'S INCLUDED                | |
| about the project...           | • Full source code             | |
|                                | • Database schema              | |
|                                | • Documentation                | |
|                                | • 30 days support              | |
|                                                                  |
+------------------------------------------------------------------+
| SELLER INFO                                                      |
| @username · Member since Jan 2025 · 12 listings · 8 sold         |
+------------------------------------------------------------------+
```

### Design Touches

1. **Neon accents** — Reanimate green (#39ff14) for positive, Bury pink (#ff2d6a) for negative
2. **Glow effects** — Subtle glow on hover for interactive elements
3. **Japanese accents** — Kanji characters for atmosphere (蘇生, 墓場, 復活)
4. **Monospace details** — Code aesthetic throughout with IBM Plex Mono
5. **Counters** — "234 views", "12 sold", visible numbers everywhere
6. **Breadcrumbs** — Text-based: `Home > Category > Listing`
7. **Footer links** — Dense footer with every link
8. **Hit counters** — Show listing view counts prominently
9. **"Posted X days ago"** — Relative timestamps everywhere
10. **Dark-first** — Black backgrounds, neon accents, visible borders

### What to Avoid

- Rounded corners (or use sparingly, 2px max)
- Gradients
- Drop shadows (except maybe inset for inputs)
- Animations/transitions (keep instant/snappy)
- Hero sections with giant images
- Excessive whitespace
- Icons without text labels
- Infinite scroll (use pagination)
- Modal overuse (prefer full pages)
- Loading spinners (prefer skeleton/text)

### Tailwind Config

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds - The Crypt
        'crypt': '#0d0d0d',        // Deep black
        'grave': '#1a1a1a',        // Dark gray for cards
        'tombstone': '#2a2a2a',    // Hover states

        // Borders
        'border-crypt': '#333333',

        // Text
        'bone': '#e8e8e8',         // Primary text
        'dust': '#888888',         // Muted text

        // Neon Accents
        'reanimate': '#39ff14',    // Neon green - upvotes, CTAs
        'bury': '#ff2d6a',         // Neon pink - downvotes, danger
        'electric': '#00d4ff',     // Cyan - links, focus
      },
      fontFamily: {
        'body': ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        'mono': ['IBM Plex Mono', 'Courier New', 'monospace'],
        'display': ['VT323', 'IBM Plex Mono', 'monospace'],
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.8125rem',
        'base': '0.9375rem',
        'lg': '1.125rem',
        'xl': '1.5rem',
        '2xl': '2rem',
      },
      boxShadow: {
        'glow-green': '0 0 10px #39ff14, 0 0 20px #39ff1466',
        'glow-pink': '0 0 10px #ff2d6a',
        'glow-cyan': '0 0 8px #00d4ff',
      },
    },
  },
  plugins: [],
}

export default config
```

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Set environment variables
4. Deploy

### Database (Neon)

1. Create Neon project
2. Copy connection string to `DATABASE_URL`
3. Run `pnpm prisma migrate deploy`

### Stripe Production

1. Switch to live API keys
2. Update webhook endpoint
3. Complete platform verification

### Domain

1. Buy domain (undeadlist.com or similar)
2. Configure in Vercel
3. Update `NEXT_PUBLIC_APP_URL`

### Post-Deploy Checklist

- [ ] Test full purchase flow with real Stripe
- [ ] Verify emails sending
- [ ] Check mobile responsiveness
- [ ] Test file upload/download
- [ ] Verify Stripe Connect onboarding
- [ ] Set up error monitoring (Sentry)
- [ ] Set up uptime monitoring

---

## Quick Reference

### Scripts

```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm prisma studio # Open Prisma GUI
pnpm prisma migrate dev # Run migrations
pnpm prisma db seed # Seed database
```

### Key Files to Edit First

1. `prisma/schema.prisma` — Database schema
2. `src/app/globals.css` — Retro styles
3. `src/lib/constants.ts` — Categories, config
4. `src/components/ui/*` — Base components
5. `src/app/layout.tsx` — Root layout

---

*Let's build this thing.*
