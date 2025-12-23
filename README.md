# 蘇生 UndeadList

**コードのためのフリーマーケット** — The indie software flea market

Built, but undiscovered. Buy and sell independent software projects that haven't found their audience yet.

🔗 **[undeadlist.com](https://undeadlist.com)**

---

## What is UndeadList?

A marketplace for indie developers to buy and sell side projects, abandoned SaaS, scripts, boilerplates, and digital products. Think Craigslist meets Flippa — but for vibe coders.

**For sellers:** Turn your dusty repos into cash. List for free, pay 2-6% only when it sells.

**For buyers:** Skip months of development. Find hidden gems ready for a second life.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Auth:** NextAuth.js
- **Payments:** Stripe Connect
- **Storage:** Cloudflare R2
- **Email:** Resend
- **AI:** Google Gemini (template customization)
- **Styling:** Tailwind CSS

---

## Features

- 🛒 **Marketplace** — Browse, search, filter by category/price
- 💳 **Stripe Connect** — Sellers get paid directly, platform takes 2-6%
- 📁 **File Delivery** — Secure downloads via presigned URLs
- 💬 **Messaging** — Buyer/seller communication
- 🗳️ **Voting** — Reanimate ⚡ or Bury ⚰️ listings
- 💬 **Comments** — Community discussion on listings
- ⭐ **Featured Listings** — Promote for visibility
- 🔐 **Admin Panel** — User/listing management, reports, audit log
- 📊 **Dashboard** — Sales, purchases, payouts, analytics

---

## Categories

SaaS Apps, Desktop Apps, Mobile Apps, Browser Extensions, APIs & Backends, Boilerplates & Starters, Scripts & Automations, AI & ML Projects, WordPress & CMS, Domains & Landing Pages, Design Assets, Games, Social Media Accounts, Newsletters, Online Communities, Crypto & Web3, NFT Projects, DeFi & Trading, Other

---

## Environment Variables

Create a `.env` file with:
```env
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_URL="https://undeadlist.com"
NEXTAUTH_SECRET="your-secret"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Cloudflare R2
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""
R2_PUBLIC_URL=""

# Email
RESEND_API_KEY=""

# AI (optional)
GOOGLE_GEMINI_API_KEY=""

# App
NEXT_PUBLIC_APP_URL="https://undeadlist.com"
NEXT_PUBLIC_APP_NAME="UndeadList"
```

---

## Local Development
```bash
# Install dependencies
pnpm install

# Set up database
pnpm prisma generate
pnpm prisma db push

# Run dev server
pnpm dev
```

---

## Deployment

Currently self-hosted via Cloudflare Tunnel.
```bash
# Build
pnpm build

# Start production server (with PM2)
pm2 start npm --name "undeadlist" -- start
```

---

## Fee Structure

| Sale Price | Platform Fee |
|------------|--------------|
| $0 - $50 | 6% |
| $51 - $200 | 4% |
| $201+ | 2% |

---

## License

Proprietary. All rights reserved.

---

**作られた。でも、まだ見つかっていない。**
*Built. But undiscovered.*
