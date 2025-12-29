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

- **Framework:** Next.js 15.1.0 (App Router)
- **Language:** TypeScript 5.7.2
- **Database:** PostgreSQL (Neon serverless)
- **ORM:** Prisma 6.1.0
- **Auth:** NextAuth.js v5
- **Payments:** Stripe Connect (Express)
- **Storage:** Cloudflare R2
- **Email:** Resend
- **SMS:** Twilio (optional, email fallback)
- **Rate Limiting:** Upstash Redis
- **Error Tracking:** Sentry
- **File Scanning:** VirusTotal
- **AI:** Google Gemini (template customization)
- **Styling:** Tailwind CSS 4.0

---

## Features

- 🛒 **Marketplace** — Browse, search, filter by category/price
- 💳 **Stripe Connect** — Sellers get paid directly, platform takes 2-6%
- 🛡️ **Buyer Protection** — Payments held 72h-14d before release to seller
- 🔬 **VirusTotal Scanning** — All uploads scanned for malware
- 🏷️ **Seller Tiers** — NEW → VERIFIED → TRUSTED → PRO based on sales
- 🐙 **GitHub Verification** — Sellers can prove repo ownership
- 📁 **File Delivery** — Secure downloads via presigned URLs (10 per purchase)
- 💬 **Messaging** — Buyer/seller communication with attachments
- 🗳️ **Voting** — Reanimate ⚡ or Bury ⚰️ listings
- 💬 **Comments** — Community discussion on listings
- ⭐ **Featured Listings** — Promote for visibility ($19.99/week)
- 🔐 **Admin Panel** — User/listing management, disputes, reports, audit log
- 📊 **Dashboard** — Sales, purchases, payouts, analytics
- 💰 **Buyer Limits** — $250-$1000/day spend limits by tier
- 📋 **BackPage** — Weekly community board (バックページ)
- 🔒 **CSRF Protection** — Double-submit cookie pattern
- 📊 **Rate Limiting** — Upstash Redis-powered abuse prevention
- 🐛 **Error Tracking** — Sentry integration with source maps
- 👤 **Guest Checkout** — Buy without account, JWT-authenticated downloads

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

# File Scanning
VIRUSTOTAL_API_KEY=""

# GitHub OAuth (seller verification)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# SMS Alerts (optional - falls back to email)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""
ADMIN_PHONE_NUMBER=""

# Cron Jobs
CRON_SECRET=""

# Admin
ADMIN_EMAIL=""
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
| Under $25 | 2% |
| $25 - $100 | 3% |
| $100 - $500 | 4% |
| $500 - $2,000 | 5% |
| $2,000+ | 6% |

Minimum fee: $0.50 per transaction.

---

## License

Proprietary. All rights reserved.

---

**作られた。でも、まだ見つかっていない。**
*Built. But undiscovered.*
