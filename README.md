# UndeadList

> コードのためのフリーマーケット — Flea Market for Code

The indie software marketplace for side projects, dusty repos, and hidden gems. No MRR requirements, no subscriber minimums. Built it? Sell it.

## What is UndeadList?

A marketplace where developers can buy and sell:
- SaaS apps & MVPs
- Scripts & utilities
- Boilerplates & starter kits
- Browser extensions
- Mobile apps
- APIs & microservices
- AI tools & integrations
- Games & game assets
- Social media accounts
- Newsletters
- Online communities

## Features

### For Sellers
- Free to list (no upfront costs)
- Low fees: 2-6% sliding scale (vs Gumroad's 10%)
- Stripe Connect for instant payouts
- Instant download OR one-time transfer delivery
- AI-powered template customization (Gemini)
- Soft delete preserves buyer access

### For Buyers
- One-click purchase (Stripe, Apple Pay, Google Pay)
- Instant downloads for digital products
- Messaging system to contact sellers
- Due diligence resources & templates
- No subscriptions - pay once, own forever

### Platform
- Dark mode cyberpunk/Tokyo aesthetic
- Japanese UI accents
- Voting system (Reanimate ⚡ / Bury ⚰️)
- Comments & discussions
- Admin moderation tools
- User reporting system

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js
- **Payments**: Stripe Connect
- **Storage**: Cloudflare R2
- **Email**: Resend
- **AI**: Google Gemini 2.5 Flash Lite
- **Styling**: Tailwind CSS

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (browse)/          # Public browsing pages
│   ├── (legal)/           # Terms, Privacy, FAQ, About
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   ├── dashboard/         # User dashboard
│   ├── listing/           # Listing detail pages
│   ├── resources/         # Seller & buyer resources
│   └── sell/              # Listing creation/edit
├── components/            # React components
│   ├── dashboard/         # Dashboard-specific
│   ├── layout/            # Header, Footer, Sidebar
│   ├── listings/          # Listing cards, forms
│   ├── messages/          # Messaging system
│   ├── resources/         # Resource templates
│   └── ui/                # Shared UI components
├── lib/                   # Utilities & config
│   ├── constants.ts       # App constants
│   ├── prisma.ts          # Database client
│   ├── r2.ts              # Cloudflare R2 client
│   └── stripe.ts          # Stripe config
└── types/                 # TypeScript types
```

## Environment Variables

See `.env.example` for full documentation. Key variables:

```env
# Database
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_SECRET=          # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
NEXT_PUBLIC_R2_PUBLIC_URL=

# Email
RESEND_API_KEY=re_...

# AI
GOOGLE_GEMINI_API_KEY=    # For template customization

# Cron Jobs
CRON_SECRET=              # For featured listing expiration

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=UndeadList
```

## Fee Structure

| Sale Price | Platform Fee |
|------------|--------------|
| Under $25 | 2% |
| $25 - $100 | 3% |
| $100 - $500 | 4% |
| $500 - $2,000 | 5% |
| $2,000+ | 6% |

Minimum fee: $0.50 per transaction

## Development

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Database
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema to database
pnpm db:seed      # Seed with sample data

# Build
pnpm build
```

## License

Private - All rights reserved

---

Built by developers, for developers. 🧟‍♂️
