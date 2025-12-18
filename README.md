# UndeadList

> Where dead code gets a second life.

A dark-themed marketplace where indie developers resurrect abandoned projects. Buy and sell side projects, SaaS apps, scripts, and boilerplates. Think Craigslist meets itch.io for code — with a Tokyo underground aesthetic.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router, React 19) |
| Language | TypeScript |
| Database | PostgreSQL (Neon serverless) |
| ORM | Prisma with @prisma/adapter-neon |
| Auth | Auth.js (NextAuth v5) |
| Payments | Stripe Connect |
| File Storage | Cloudflare R2 |
| Styling | Tailwind CSS v4 |
| Email | Resend |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL database (we use Neon)
- Stripe account
- Cloudflare R2 bucket (optional for dev)
- Resend account (optional for dev)

### Installation

```bash
# Clone the repo
git clone https://github.com/jpburns82/shittySaas.git
cd shittySaas

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm db:generate  # Generate Prisma client
pnpm db:migrate   # Run database migrations
pnpm db:push      # Push schema to database
pnpm db:seed      # Seed database with initial data
pnpm db:studio    # Open Prisma Studio GUI
pnpm stripe:listen # Forward Stripe webhooks locally
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, register, verify)
│   ├── (browse)/          # Browse pages (listings, category, search)
│   ├── api/               # API routes
│   ├── dashboard/         # Seller dashboard
│   ├── listing/           # Listing detail & purchase
│   ├── sell/              # Create/edit listings
│   ├── user/              # Public user profiles
│   └── admin/             # Admin panel
├── components/
│   ├── ui/                # Base UI components
│   │   ├── image-upload.tsx   # Drag-drop image uploader
│   │   └── image-gallery.tsx  # Lightbox gallery
│   ├── layout/            # Header, footer, nav
│   ├── listings/          # Listing components
│   ├── search/            # Search & filter components
│   ├── payments/          # Stripe components
│   ├── messages/          # Messaging components
│   └── comments/          # Comment components
├── lib/                   # Utilities & configs
│   ├── prisma.ts          # Prisma client
│   ├── auth.ts            # Auth.js config
│   ├── stripe.ts          # Stripe helpers
│   ├── r2.ts              # Cloudflare R2 client
│   └── email.ts           # Resend email helpers
├── hooks/                 # React hooks
└── types/                 # TypeScript types
```

## Environment Variables

See `.env.example` for all required variables. Key ones:

```env
DATABASE_URL          # PostgreSQL connection string
NEXTAUTH_SECRET       # Auth.js secret (generate with: openssl rand -base64 32)
STRIPE_SECRET_KEY     # Stripe secret key
STRIPE_PUBLISHABLE_KEY # Stripe public key
R2_ACCESS_KEY_ID      # Cloudflare R2 access key
RESEND_API_KEY        # Resend API key
```

## Database Schema

The database includes models for:
- **Users** - Accounts with Stripe Connect integration
- **Listings** - Software projects for sale
- **Categories** - Listing categories (SaaS, Extensions, etc.)
- **Purchases** - Transaction records
- **Votes** - Community upvotes/downvotes
- **Comments** - Threaded listing discussions
- **Messages** - Direct buyer/seller messaging
- **Reports** - Community moderation

See `prisma/schema.prisma` for the full schema.

## Current Status

### Core Platform Complete

**Authentication & Users**
- User registration, login, email verification
- User profiles with settings (display name, bio, social links)
- Stripe Connect seller onboarding
- Admin role system
- User blocking functionality

**Marketplace**
- Homepage with featured and latest listings
- Browse/search with category filtering
- Full listing detail pages with SEO
- Create/edit listing forms with validation
- File upload to Cloudflare R2
- Image upload system (thumbnails, screenshots, avatars)
- Image gallery with lightbox viewer

**Payments & Delivery**
- Stripe Checkout integration
- Stripe Connect for seller payouts
- Webhook handling (checkout, payments, account updates)
- File download system with presigned URLs
- Purchase confirmation emails

**Dashboard**
- Seller dashboard (overview, listings, sales, payouts)
- Buyer dashboard (purchases, downloads)
- Messaging inbox with conversation list
- Message thread detail page with attachments
- Message notification preferences (instant/digest/off)
- Account settings (password change, account deletion, avatar upload)

**Admin**
- Admin dashboard with platform stats
- Listing moderation (approve/reject/remove)
- User management (search, warn, ban, toggle admin)
- Reports management (view, review, take action)
- Featured listings (admin control + paid promotion via Stripe)
- Thread suspension
- Cron job for expiring featured listings

**Community**
- Voting system (⚡ Reanimate / ⚰️ Bury) with neon glow effects
- Threaded comments system (3-level depth)
- Comment composer with 500 char limit
- Edit window (15 minutes)
- Report system for comments
- Verified Purchase and OP badges

### Development Setup
- Neon serverless database with @prisma/adapter-neon
- Stripe CLI configured for local webhooks
- All TypeScript errors resolved

### Remaining Work (Phase 8: Launch Prep)
| Task | Status |
|------|--------|
| Initial seed data for launch | Complete |
| Meta tags and OpenGraph images | In progress |
| Mobile responsiveness audit and fixes | In progress |
| Error boundaries and error pages | In progress |
| Production environment template | In progress |
| Lighthouse performance audit | Planned |
| Production environment setup (Vercel) | Planned |
| Production Stripe keys and webhooks | Planned |

## Design System

UndeadList uses a dark "Tokyo Underground" theme with neon accents:

| Element | Color |
|---------|-------|
| Background (crypt) | `#0d0d0d` |
| Background (grave) | `#1a1a1a` |
| Text (bone) | `#e8e8e8` |
| Accent (reanimate) | `#39ff14` (neon green) |
| Accent (bury) | `#ff2d6a` (neon pink) |
| Accent (electric) | `#00d4ff` (cyan) |

Japanese character accents are used throughout for atmosphere.

## Documentation

- [FEATURES.md](./FEATURES.md) - Full feature specification
- [ROADMAP.md](./ROADMAP.md) - Development roadmap & phases

## License

Private - All rights reserved
