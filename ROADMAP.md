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

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============ USERS ============

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  username        String    @unique
  passwordHash    String
  displayName     String?
  bio             String?
  avatarUrl       String?
  
  // Stripe Connect
  stripeAccountId String?   @unique
  stripeOnboarded Boolean   @default(false)
  
  // Status
  emailVerified   DateTime?
  isAdmin         Boolean   @default(false)
  isBanned        Boolean   @default(false)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  listings        Listing[]
  purchases       Purchase[]
  sentMessages    Message[] @relation("SentMessages")
  receivedMessages Message[] @relation("ReceivedMessages")
  
  @@index([email])
  @@index([username])
  @@index([stripeAccountId])
}

// ============ LISTINGS ============

model Listing {
  id              String    @id @default(cuid())
  slug            String    @unique
  
  // Basic Info
  title           String
  description     String    @db.Text
  shortDescription String?  @db.VarChar(280)
  
  // Pricing
  priceType       PriceType @default(FIXED)
  price           Int?      // In cents, null for free
  minPrice        Int?      // For "pay what you want"
  
  // What's Included
  whatsIncluded   String?   @db.Text
  techStack       String[]  // Array of tech tags
  
  // URLs
  liveUrl         String?
  repoUrl         String?
  
  // Files (for digital delivery)
  files           ListingFile[]
  
  // Media
  screenshots     String[]  // Array of URLs
  
  // Categorization
  category        Category  @relation(fields: [categoryId], references: [id])
  categoryId      String
  
  // Status
  status          ListingStatus @default(DRAFT)
  featured        Boolean   @default(false)
  featuredUntil   DateTime?
  
  // Stats
  viewCount       Int       @default(0)
  
  // Ownership
  seller          User      @relation(fields: [sellerId], references: [id])
  sellerId        String
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  purchases       Purchase[]
  messages        Message[]
  
  @@index([sellerId])
  @@index([categoryId])
  @@index([status])
  @@index([createdAt])
}

model ListingFile {
  id          String   @id @default(cuid())
  listing     Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)
  listingId   String
  
  fileName    String
  fileSize    Int      // In bytes
  fileKey     String   // R2 object key
  
  createdAt   DateTime @default(now())
  
  @@index([listingId])
}

enum PriceType {
  FREE
  FIXED
  PAY_WHAT_YOU_WANT
  CONTACT
}

enum ListingStatus {
  DRAFT
  PENDING_REVIEW
  ACTIVE
  SOLD
  ARCHIVED
  REJECTED
}

// ============ CATEGORIES ============

model Category {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique
  description String?
  icon        String?   // Emoji or icon name
  sortOrder   Int       @default(0)
  
  listings    Listing[]
  
  @@index([slug])
}

// ============ PURCHASES ============

model Purchase {
  id                String   @id @default(cuid())
  
  listing           Listing  @relation(fields: [listingId], references: [id])
  listingId         String
  
  buyer             User     @relation(fields: [buyerId], references: [id])
  buyerId           String
  
  // Payment
  amountPaid        Int      // In cents
  platformFee       Int      // Your cut, in cents
  sellerPayout      Int      // Seller gets, in cents
  
  // Stripe
  stripePaymentId   String   @unique
  stripeTransferId  String?  // Transfer to seller
  
  // Status
  status            PurchaseStatus @default(PENDING)
  
  // Delivery
  deliveredAt       DateTime?
  
  // Guest checkout (if no account)
  guestEmail        String?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([listingId])
  @@index([buyerId])
  @@index([stripePaymentId])
}

enum PurchaseStatus {
  PENDING
  COMPLETED
  REFUNDED
  DISPUTED
}

// ============ MESSAGES ============

model Message {
  id          String   @id @default(cuid())
  
  listing     Listing  @relation(fields: [listingId], references: [id])
  listingId   String
  
  sender      User     @relation("SentMessages", fields: [senderId], references: [id])
  senderId    String
  
  receiver    User     @relation("ReceivedMessages", fields: [receiverId], references: [id])
  receiverId  String
  
  content     String   @db.Text
  read        Boolean  @default(false)
  
  createdAt   DateTime @default(now())
  
  @@index([listingId])
  @@index([senderId])
  @@index([receiverId])
}

// ============ ADMIN ============

model AuditLog {
  id          String   @id @default(cuid())
  action      String
  entityType  String
  entityId    String
  userId      String?
  metadata    Json?
  
  createdAt   DateTime @default(now())
  
  @@index([entityType, entityId])
}
```

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
- [ ] Voting API (`/api/listings/[id]/vote`)
- [ ] Wire vote buttons to backend (UI exists, non-functional)

**Deliverable:** Threaded comments system complete, voting pending

### Phase 6: Account & Settings 📋 PLANNED

- [ ] Password change
- [ ] Account deletion
- [ ] Listing archive functionality

**Deliverable:** Full account management

### Phase 7: Admin Expansion 📋 PLANNED

- [x] Admin moderation panel (listings)
- [x] Admin user warning system
- [x] Admin thread suspension
- [ ] Admin users management page
- [ ] Admin reports page
- [ ] Featured listings logic

**Deliverable:** Complete admin tools

### Phase 8: Launch Prep 📋 PLANNED

- [ ] SEO (meta tags, OG images)
- [ ] Mobile responsive check
- [ ] Performance audit
- [ ] Deploy to Vercel
- [ ] Set up production database
- [ ] Configure production Stripe
- [ ] Seed initial listings

**Deliverable:** Production-ready launch

### Future (Post-Launch)

- [ ] "Pay what you want" pricing
- [ ] Featured listing purchases
- [ ] Seller analytics
- [ ] Rating/review system
- [ ] Improved search (Meilisearch)
- [ ] API for external integrations

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
/* Primary button - looks like Win95/98 */
.btn {
  background: var(--button-bg);
  border: 2px solid;
  border-color: #ffffff #808080 #808080 #ffffff; /* 3D raised effect */
  padding: 6px 16px;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  cursor: pointer;
}

.btn:hover {
  background: var(--button-hover);
}

.btn:active {
  border-color: #808080 #ffffff #ffffff #808080; /* 3D pressed effect */
}

/* Link button */
.btn-link {
  background: none;
  border: none;
  color: var(--accent-blue);
  text-decoration: underline;
  cursor: pointer;
}
```

#### Cards (Listing Cards)

```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-dark);
  padding: 12px;
}

.card-title {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--accent-blue);
  text-decoration: underline;
}

.card-title:hover {
  color: var(--accent-blue-visited);
}
```

#### Inputs

```css
input, textarea, select {
  border: 2px solid;
  border-color: #808080 #ffffff #ffffff #808080; /* Inset effect */
  padding: 6px 8px;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  background: #ffffff;
}

input:focus, textarea:focus, select:focus {
  outline: 1px dotted var(--text-primary);
  outline-offset: 2px;
}
```

#### Tables (for listings, admin)

```css
table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

th {
  background: var(--button-bg);
  border: 1px solid var(--border-dark);
  padding: 8px;
  text-align: left;
  font-weight: 600;
}

td {
  border: 1px solid var(--border-light);
  padding: 8px;
}

tr:hover {
  background: var(--bg-accent);
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

### Retro Touches

1. **Underlined links** — Always. Blue unvisited, purple visited.
2. **ASCII/text dividers** — Use `---`, `===`, `***` in some places
3. **Badge styling** — Simple rectangles with borders, not pills
4. **"NEW!" markers** — Yellow background, bold text, maybe blinking (sparingly)
5. **Counters** — "234 views", "12 sold", visible numbers everywhere
6. **Breadcrumbs** — Text-based: `Home > Category > Listing`
7. **Footer links** — Craigslist-style dense footer with every link
8. **Hit counters** — Show listing view counts prominently
9. **"Posted X days ago"** — Relative timestamps everywhere
10. **Email aesthetic** — Some elements can look like plain-text email

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
        'bg-primary': '#f5f5f0',
        'bg-secondary': '#ffffff',
        'bg-accent': '#fffde7',
        'border-light': '#d0d0c8',
        'border-dark': '#333333',
        'text-primary': '#1a1a1a',
        'text-secondary': '#555555',
        'text-muted': '#888888',
        'link': '#0000ee',
        'link-visited': '#551a8b',
        'success': '#008000',
        'error': '#cc0000',
        'warning': '#ffcc00',
        'btn-bg': '#e0e0e0',
        'btn-border': '#999999',
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
      borderWidth: {
        '3': '3px',
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
