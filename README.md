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

### Completed
- Project setup with Next.js 15, TypeScript, Tailwind
- Full database schema with Prisma
- Authentication (register, login, email verification)
- Homepage with listing grid and categories
- UI component library (retro aesthetic)
- API routes for auth, listings, Stripe, uploads
- Dashboard and admin page structures

### In Progress
- Listing create/edit forms
- File upload to R2
- Stripe Connect onboarding
- Checkout flow

### Planned
- Buyer/seller messaging
- Email notifications
- Featured listings
- Admin moderation tools
- SEO optimization

## Documentation

- [FEATURES.md](./FEATURES.md) - Full feature specification
- [ROADMAP.md](./ROADMAP.md) - Development roadmap & phases

## License

Private - All rights reserved
