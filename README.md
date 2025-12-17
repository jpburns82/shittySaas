# SideProject.deals

> The flea market for software. Buy and sell side projects, SaaS apps, scripts, and boilerplates.

A community marketplace where indie developers can list and sell their software projects. Think Craigslist meets itch.io for code.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router, React 19) |
| Language | TypeScript |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
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
│   ├── layout/            # Header, footer, nav
│   ├── listings/          # Listing components
│   ├── search/            # Search & filter components
│   ├── payments/          # Stripe components
│   └── messages/          # Messaging components
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
- **Comments** - Listing discussions
- **Messages** - Direct buyer/seller messaging
- **Reports** - Community moderation

See `prisma/schema.prisma` for the full schema.

## Current Status

### Production Ready (90%)
- Full authentication flow (register, login, email verification)
- Homepage with listing grid and category filtering
- Browse listings with search and filters
- Listing detail pages with purchase flow
- Create/edit listing forms with validation
- Dashboard (overview, listings, sales, purchases, payouts)
- Stripe Connect integration for seller payouts
- Stripe Checkout for purchases
- Public seller profiles
- Buyer/seller messaging system
- Admin dashboard with stats
- Admin listing moderation
- R2 file storage integration
- Email notifications via Resend
- UI component library (retro aesthetic)

### Phase 1 Bug Fixes Complete
- Fixed R2 upload exports and validation
- Fixed Stripe parameter naming inconsistencies
- Fixed email function signatures
- Fixed schema import names
- Fixed admin role checks
- Fixed listing status enums
- All TypeScript errors resolved

### Remaining Work (Phases 2-8)
- **Phase 2:** File download endpoint for purchases
- **Phase 3:** Message thread detail page
- **Phase 4:** Comments system (API + UI)
- **Phase 5:** Voting system (UI integration)
- **Phase 6:** Account management (password change, deletion)
- **Phase 7:** Listing archive functionality
- **Phase 8:** Admin users/reports pages

## Documentation

- [FEATURES.md](./FEATURES.md) - Full feature specification
- [ROADMAP.md](./ROADMAP.md) - Development roadmap & phases

## License

Private - All rights reserved
