# UndeadList — Feature Overview & User Experience

> Where dead code gets a second life. A community marketplace for indie software with a Tokyo underground aesthetic. Buy it, sell it, resurrect it.

---

## Implementation Status

| Feature Area | Status | Notes |
|--------------|--------|-------|
| User accounts & auth | ✅ Complete | Register, login, email verify, profiles |
| Listings (create/edit/browse) | ✅ Complete | Full CRUD, search, categories |
| Payments (Stripe) | ✅ Complete | Checkout, Connect, webhooks |
| File delivery | ✅ Complete | R2 upload, presigned download URLs |
| Seller dashboard | ✅ Complete | Stats, sales, payouts |
| Buyer dashboard | ✅ Complete | Purchases, downloads |
| Messaging | ✅ Complete | Inbox, thread detail, attachments, notifications |
| User blocking | ✅ Complete | Block/unblock users from messaging |
| Admin moderation | ✅ Complete | Warn users, suspend threads, listing moderation |
| Notification settings | ✅ Complete | Message notification preferences (instant/digest/off) |
| Voting | ⚠️ Partial | UI exists but non-functional (no API) |
| Comments | ✅ Complete | Threaded (3-level), 500 char limit, 15-min edit window |
| Admin users/reports | 📋 Planned | Pages not built |

---

## Table of Contents

1. [Platform Philosophy](#platform-philosophy)
2. [User Types & Accounts](#user-types--accounts)
3. [Listing Features](#listing-features)
4. [Community Features](#community-features)
5. [Transaction Flow](#transaction-flow)
6. [Trust & Safety Approach](#trust--safety-approach)
7. [User Flows](#user-flows)
8. [Page-by-Page Breakdown](#page-by-page-breakdown)
9. [Legal & Disclaimers](#legal--disclaimers)
10. [What We Don't Do](#what-we-dont-do)

---

## Platform Philosophy

### What We Are

- **A bulletin board for software** — Post it, price it, sell it
- **Community-driven** — Users police themselves via votes and comments
- **Hands-off** — We facilitate transactions, not relationships
- **Transparent** — Flat commission, no hidden fees, no bullshit
- **Fast** — List in 2 minutes, buy in 30 seconds

### What We're NOT

- **An escrow service** — We move money, we don't hold hands
- **A code review platform** — We don't verify quality
- **Customer support for your purchase** — That's between buyer and seller
- **A refund department** — All sales are final unless seller agrees otherwise
- **Your lawyer** — Do your own due diligence

### The Vibe

Think a Tokyo underground market where dead code gets resurrected. Dark, atmospheric, community-trusted. Neon-lit listings in a graveyard of abandoned projects. The kind of place where you might find a gem or you might find garbage — and that's on you to figure out.

---

## User Types & Accounts

### Account Levels

| Type | Can Browse | Can Buy | Can Sell | Can Comment | Can Vote |
|------|-----------|---------|----------|-------------|----------|
| Guest | ✓ | ✓ (guest checkout) | ✗ | ✗ | ✗ |
| Member | ✓ | ✓ | ✓ | ✓ | ✓ |
| Verified Seller | ✓ | ✓ | ✓ (badge) | ✓ | ✓ |

### Account Creation

**Required:**
- Email (verified)
- Username (unique, 3-30 chars, alphanumeric + underscore)
- Password

**Optional (but encouraged):**
- Display name
- Bio
- Website/portfolio link
- Twitter/GitHub links
- Avatar

**To Sell:**
- Must connect Stripe account (we use Stripe Connect)
- Stripe handles identity verification, payouts, tax docs
- We never touch seller's banking info directly

### Verified Seller Badge

Earned automatically when:
- 3+ completed sales with no disputes, OR
- Account age 30+ days with 1+ sale, OR
- Manually granted (early adopters, known community members)

Badge appears on profile and all listings. Builds trust, not required.

---

## Listing Features

### Core Listing Fields

| Field | Required | Description |
|-------|----------|-------------|
| Title | ✓ | Max 100 chars |
| Short Description | ✓ | Max 280 chars (shows in cards) |
| Full Description | ✓ | Markdown supported, max 10,000 chars |
| Category | ✓ | Pick one from predefined list |
| Price | ✓ | Free / Fixed / Pay What You Want / Contact Me |

### Media & Links

| Field | Required | Description |
|-------|----------|-------------|
| Screenshots | Recommended | Up to 5 images (PNG, JPG, GIF, WebP), max 5MB each |
| Thumbnail | Auto | First screenshot becomes thumbnail, or upload separate |
| Live Demo URL | Optional | Link to working demo/site |
| Repository URL | Optional | GitHub, GitLab, Bitbucket, etc. |
| Video URL | Optional | YouTube, Loom, or direct MP4 link |

### What's Included Section

Structured checklist seller fills out:

```
[x] Full source code
[x] Database schema / migrations
[ ] Documentation
[ ] Deployment guide
[x] 30 days email support
[ ] Future updates
[x] Commercial license
[ ] White-label rights
```

Seller can also add custom items as free text.

### Tech Stack Tags

- Select from common options (React, Node, Python, etc.)
- Add custom tags if needed
- Max 10 tags per listing
- Helps buyers filter and search

### Delivery Method

Seller specifies how buyer gets the goods:

| Method | Description |
|--------|-------------|
| **Instant Download** | Files uploaded to platform, buyer downloads after payment |
| **Repository Access** | Seller adds buyer to private repo (GitHub, etc.) |
| **Manual Transfer** | Seller sends files/access via email within X days |
| **Domain/Asset Transfer** | Instructions for transferring domains, accounts, etc. |

Seller must indicate expected delivery timeframe (Instant, 24h, 48h, 7 days).

### Pricing Options

| Type | How It Works |
|------|--------------|
| **Free** | $0, anyone can download/access |
| **Fixed Price** | Set price, buyer pays exactly that |
| **Pay What You Want** | Minimum price (can be $0), buyer chooses amount |
| **Contact Me** | No price shown, buyer must message first |

Price displayed in USD. Stripe handles currency conversion for international buyers.

---

## Community Features

### Voting System

Simple thumbs up / thumbs down on listings.

**Thumbs Up (👍)**
- "This looks legit"
- "Good value"
- "Seller delivered"

**Thumbs Down (👎)**
- "Something's off"
- "Overpriced"
- "Had issues"

**Display:**
- Show net score: `+12` or `-3`
- Show ratio: `47 👍 / 5 👎`
- Users can change their vote anytime
- One vote per user per listing

**Who Can Vote:**
- Any logged-in member
- Verified purchases get "Verified Buyer" tag on their vote
- Guests cannot vote

**Sorting by votes:**
- "Top" sort option on browse page
- Helps surface quality, bury garbage

### Comments System (WHISPERS FROM THE CRYPT)

Open comments on every listing. This is the community Q&A — where the dead speak.

**Use Cases:**
- Buyers asking questions before purchase
- Seller clarifying details
- Post-purchase feedback
- Warnings from community

**Features:**
- Threaded replies (3 levels deep)
- 500 character limit per comment
- Seller's comments highlighted with "Seller" badge
- Listing owner gets "OP" badge with green glow border
- Verified buyers get "Verified Purchase" badge
- 15-minute edit window (prevents bait-and-switch)
- Delete own comments anytime
- Real-time character counter (turns red near limit)

**Moderation:**
- Report button on every comment
- Report reasons: Spam, Harassment, Misleading, Scam, Malware, etc.
- Seller can hide (not delete) comments on their listings
- Hidden comments show "[Hidden by seller]" — transparency
- Community can still see hidden comments by clicking "show"
- Obvious spam/abuse removed by platform

**What Comments Are NOT:**
- Customer support (take it to DMs)
- A place to negotiate price (DMs or "Contact Me" listings)
- Guaranteed response (sellers aren't obligated)

### User Profiles

Public profile page for every member:

**Displayed:**
- Username + display name
- Avatar
- Bio
- Member since date
- Links (website, Twitter, GitHub)
- Verified Seller badge (if earned)
- Stats: X listings · Y sold · Z purchases

**Seller Section (if they have listings):**
- All their active listings
- Overall vote ratio across all listings
- "Contact" button (opens DM)

**Privacy:**
- Email never shown publicly
- No real name required
- No location tracking

### Direct Messages

Simple messaging between users:

**Features:**
- Message any user with an account
- Conversations tied to listings (context)
- Or general messages (not listing-specific)
- Email notification when new message received
- No read receipts (privacy)
- Can block users (no more messages from them)

**What DMs Are For:**
- Pre-sale questions not suitable for public comments
- Post-sale delivery coordination
- Negotiation on "Contact Me" listings
- Support between buyer/seller

**Platform Stance:**
- We don't read your messages
- We don't mediate disputes via DM
- If someone's harassing you, block and report

---

## Transaction Flow

### How Money Moves

```
Buyer pays $100
        ↓
    [Stripe]
        ↓
Platform fee deducted ($10 at 10%)
        ↓
Seller receives $90 (minus Stripe processing ~2.9% + $0.30)
        ↓
Seller's Stripe account (instant or daily payout based on their settings)
```

### Fee Structure

| Sale Price | Platform Fee | Seller Receives |
|------------|--------------|-----------------|
| $1 - $100 | 10% | 90% |
| $101 - $1,000 | 8% | 92% |
| $1,001+ | 5% | 95% |

*Plus standard Stripe processing fees (~2.9% + $0.30), paid by seller from their portion.*

**Why tiered?**
- Small sales: We do the same work, fair to take more
- Big sales: Seller did more work, we take less
- Competitive with alternatives (Gumroad 10%, itch.io 10%, Paddle 5%+)

### Purchase Flow (Buyer)

```
1. Browse/Search → Find listing
2. View listing details, screenshots, comments
3. Click "Buy Now" ($49)
4. Stripe Checkout (card, Apple Pay, Google Pay)
5. Payment success → Redirect to download/access page
6. Get the goods (instant download, repo invite, or wait for manual delivery)
7. Optionally: Vote, leave comment
```

**Guest Checkout:**
- Enter email at checkout
- Download link sent to email
- No account needed
- Can create account later to access purchase history

### Sale Flow (Seller)

```
1. Create account → Connect Stripe
2. Create listing (fill out form, upload files/screenshots)
3. Publish (goes live immediately, no approval queue)
4. Share your listing (we give you the link)
5. Someone buys → Get email notification
6. If manual delivery: Send goods, mark as delivered
7. Money hits your Stripe account
8. Repeat
```

### Delivery Confirmation

**Instant Download:**
- Automatic, buyer downloads immediately
- Marked complete on purchase

**Repository/Manual:**
- Buyer can mark "Received" 
- Auto-marks complete after 7 days if buyer doesn't dispute
- Seller can mark "Delivered" (buyer gets notified)

### After the Sale

- Buyer and seller can continue communicating via DMs
- No platform involvement unless:
  - Fraud reported (fake listing, stolen code)
  - Chargeback initiated via Stripe
- Seller keeps listing active (can sell same thing multiple times)
- Or marks as "Sold" (one-time sale, listing archived)

---

## Trust & Safety Approach

### Our Philosophy

**Community-first moderation.** We're not the police. We provide tools, you provide judgment.

### Trust Signals (Visible to Buyers)

| Signal | What It Means |
|--------|---------------|
| ✓ Verified Seller | Completed sales, established member |
| 👍 47 / 👎 3 | Community sentiment |
| "Member since Jan 2024" | Account age |
| "12 sold" | Track record |
| 💬 Active comments | Seller engages with questions |
| 📦 Instant Download | No waiting, lower risk |
| 🔗 Live Demo | Can see it working |
| 🔗 Public Repo | Can inspect code before buying |

### Red Flags (Buyer Beware)

We may show warnings (not block) for:
- New account (< 7 days) with high-priced listing
- No screenshots or demo
- "Contact Me" pricing on new accounts
- Multiple reports but below removal threshold
- Listing description is suspiciously short

**We show the warning, buyer decides.**

### Reporting System

Anyone can report:
- **Listings** — Stolen code, misleading description, scam, illegal content
- **Comments** — Spam, harassment, off-topic
- **Users** — Fraud, abuse, fake reviews

**What Happens:**
1. Report logged with reason
2. If threshold hit (X reports), flagged for review
3. We review and take action if warranted:
   - Remove content
   - Warn user
   - Suspend user
   - Ban user (repeated/severe violations)
4. Reporter not notified of outcome (no weaponizing reports)

### What Gets You Banned

- Selling stolen code / violating copyright
- Selling malware or malicious software
- Fake listings (taking money, not delivering)
- Review manipulation (fake votes, shill comments)
- Harassment of other users
- Repeated chargebacks (fraud indicator)
- Multiple accounts to evade bans

### What We DON'T Police

- Code quality (that's subjective)
- Whether the price is "fair"
- Personal disputes between buyer/seller
- Whether the project is a "good idea"
- Use of AI-generated code (it's 2025, get over it)

---

## User Flows

### Flow 1: First-Time Seller

```
┌─────────────────────────────────────────────────────────────┐
│ 1. LAND ON HOMEPAGE                                         │
│    See listings, vibe check, "I could sell my thing here"   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. CLICK "SELL YOUR PROJECT"                                │
│    Prompted to create account                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. CREATE ACCOUNT                                           │
│    Email, username, password                                │
│    Verify email (click link)                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. CONNECT STRIPE                                           │
│    "To receive payments, connect your Stripe account"       │
│    → Stripe Connect onboarding (2-5 min)                    │
│    → Return to site                                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. CREATE LISTING                                           │
│    Fill out form:                                           │
│    - Title, descriptions                                    │
│    - Category, tech stack                                   │
│    - Price                                                  │
│    - Upload screenshots                                     │
│    - Upload files OR set delivery method                    │
│    - Add demo/repo links                                    │
│    Preview → Publish                                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. LISTING IS LIVE                                          │
│    Get shareable link                                       │
│    Share on Twitter, Reddit, etc.                           │
│    Wait for buyers                                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. SOMEONE BUYS                                             │
│    Email notification: "You made a sale!"                   │
│    If instant: Done, buyer has files                        │
│    If manual: Deliver within timeframe, mark complete       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. GET PAID                                                 │
│    Money in Stripe account                                  │
│    Withdraw on your schedule                                │
└─────────────────────────────────────────────────────────────┘
```

### Flow 2: Buyer (With Account)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. BROWSE/SEARCH                                            │
│    Filter by category, price, tech stack                    │
│    Sort by newest, top voted, price                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. CLICK LISTING                                            │
│    Read description, check screenshots                      │
│    Look at demo/repo links                                  │
│    Read comments, check votes                               │
│    Check seller profile                                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. DECIDE TO BUY                                            │
│    Click "Buy Now - $49"                                    │
│    Or "Make Offer" / "Contact Seller" if applicable         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. CHECKOUT (STRIPE)                                        │
│    Enter card (or Apple Pay, Google Pay)                    │
│    Confirm purchase                                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. ACCESS PURCHASE                                          │
│    Instant: Download button appears                         │
│    Manual: "Seller will deliver within 48 hours"            │
│    Also: Email confirmation with access link                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. POST-PURCHASE                                            │
│    Download files / access repo                             │
│    Leave comment or vote                                    │
│    Contact seller via DM if needed                          │
└─────────────────────────────────────────────────────────────┘
```

### Flow 3: Guest Buyer (No Account)

```
Browse → Click Listing → Buy Now → Stripe Checkout → Enter Email
    → Payment Success → Download link sent to email
    → Optional: "Create account to track purchases"
```

### Flow 4: Asking Questions Before Buying

```
View Listing → Scroll to Comments → "Ask a question"
    → Login prompt (must have account to comment)
    → Post question publicly
    → Wait for seller or community response
    → Decide to buy (or not)
```

---

## Page-by-Page Breakdown

### Homepage

```
┌──────────────────────────────────────────────────────────────────┐
│ [LOGO] 蘇生 UndeadList              [Browse] [Sell] [Login]      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│         墓場 THE GRAVEYARD                                       │
│   Where dead code gets a second life.                            │
│                                                                  │
│   [ Browse Listings ]    [ Sell Your Project ]                   │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ CATEGORIES                                                       │
│ [All] [SaaS] [Mobile] [Extensions] [APIs] [Boilerplates] [More▾]│
├──────────────────────────────────────────────────────────────────┤
│ LATEST LISTINGS                                      [View All →]│
│                                                                  │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ [thumb]     │ │ [thumb]     │ │ [thumb]     │ │ [thumb]     │ │
│ │ Title       │ │ Title       │ │ Title       │ │ Title       │ │
│ │ Description │ │ Description │ │ Description │ │ Description │ │
│ │ $49 · 👍 12 │ │ FREE · 👍 8 │ │ $199 · 👍 3 │ │ $25 · 👍 0  │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
│                                                                  │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ ...         │ │ ...         │ │ ...         │ │ ...         │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ HOW IT WORKS                                                     │
│                                                                  │
│ FOR SELLERS                      FOR BUYERS                      │
│ 1. List your project             1. Browse listings              │
│ 2. Set your price                2. Buy with one click           │
│ 3. Get paid when it sells        3. Download instantly           │
│                                                                  │
│ We take 5-10%. You keep the rest.                                │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ Footer: About · FAQ · Terms · Contact · Twitter                  │
└──────────────────────────────────────────────────────────────────┘
```

### Browse Page

```
┌──────────────────────────────────────────────────────────────────┐
│ BROWSE LISTINGS                                                  │
├──────────────────────────────────────────────────────────────────┤
│ [ Search............................ ] [🔍]                      │
│                                                                  │
│ Categories: [All] [SaaS] [Mobile] [Extensions] [APIs] [...]      │
│                                                                  │
│ Sort: [Newest ▾]   Price: [Any ▾]   Tech: [Any ▾]               │
│                                                                  │
│ Showing 1-25 of 342 listings                                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ [thumb] AI Email Assistant                          $149  │   │
│ │         Automated email responses using GPT-4             │   │
│ │         [React] [Node] [OpenAI] · 👍 23 · 3 days ago     │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ [thumb] SaaS Boilerplate                             $49  │   │
│ │         Next.js + Stripe + Auth starter kit               │   │
│ │         [Next.js] [Stripe] [Prisma] · 👍 67 · 2 wks ago  │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ [thumb] Browser Tab Manager                          FREE │   │
│ │         Chrome extension to organize your tabs            │   │
│ │         [Chrome] [JavaScript] · 👍 12 · 1 month ago       │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ... more listings ...                                            │
│                                                                  │
│              [1] [2] [3] [4] [5] ... [14] [Next →]               │
└──────────────────────────────────────────────────────────────────┘
```

### Listing Detail Page

```
┌──────────────────────────────────────────────────────────────────┐
│ ← Back to listings                                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ AI EMAIL ASSISTANT                                               │
│ by @johndoe · Listed Dec 10, 2025 · 👁 1,247 views              │
│                                                                  │
│ ┌────────────────────────────┐  ┌─────────────────────────────┐ │
│ │                            │  │ $149                        │ │
│ │      [Screenshot 1]        │  │ One-time purchase           │ │
│ │                            │  │                             │ │
│ │                            │  │ [    BUY NOW    ]           │ │
│ └────────────────────────────┘  │                             │ │
│ [1] [2] [3] [4] thumbs          │ or contact seller           │ │
│                                 │                             │ │
│                                 │ ─────────────────────────── │ │
│                                 │ WHAT'S INCLUDED             │ │
│                                 │ ✓ Full source code          │ │
│                                 │ ✓ Database schema           │ │
│                                 │ ✓ Setup documentation       │ │
│                                 │ ✓ 30 days email support     │ │
│                                 │ ✗ Future updates            │ │
│                                 │                             │ │
│                                 │ DELIVERY                    │ │
│                                 │ 📦 Instant download         │ │
│                                 └─────────────────────────────┘ │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ DESCRIPTION                                                      │
│ ────────────────────────────────────────────────────────────     │
│ Full markdown description here...                                │
│                                                                  │
│ - Feature 1                                                      │
│ - Feature 2                                                      │
│ - Feature 3                                                      │
│                                                                  │
│ ```javascript                                                    │
│ // Code sample                                                   │
│ ```                                                              │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ LINKS                                                            │
│ 🔗 Live Demo: https://demo.example.com                          │
│ 🔗 Repository: https://github.com/user/repo (private)           │
│ 🔗 Video: https://youtube.com/watch?v=xxx                       │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ TECH STACK                                                       │
│ [React] [Node.js] [PostgreSQL] [OpenAI] [Tailwind]              │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ SELLER                                                           │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [avatar] @johndoe · ✓ Verified Seller                       │ │
│ │ Member since Jan 2024 · 8 listings · 23 sold                │ │
│ │ [View Profile] [Message]                                    │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ COMMUNITY                                        👍 23  👎 2     │
│ ─────────────────────────────────────────────────────────────── │
│                                                                  │
│ [👍 Upvote] [👎 Downvote]                                       │
│                                                                  │
│ COMMENTS (7)                                     [Newest ▾]      │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ @buyer123 · 🏷 Purchased · 2 days ago                       │ │
│ │ Works great, easy to set up. Seller was helpful with a      │ │
│ │ small config issue.                                         │ │
│ │                                                   [Reply]   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ @curious_dev · 5 days ago                                   │ │
│ │ Does this work with Gmail only or other providers too?      │ │
│ │                                                   [Reply]   │ │
│ │                                                             │ │
│ │   ↳ @johndoe · SELLER · 5 days ago                         │ │
│ │     Works with any IMAP provider. Gmail, Outlook,          │ │
│ │     ProtonMail, etc.                                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [ Write a comment...                                      ] │ │
│ │                                              [Post Comment] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Seller Dashboard

```
┌──────────────────────────────────────────────────────────────────┐
│ DASHBOARD                                                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Welcome back, @johndoe                                           │
│                                                                  │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐         │
│ │ $1,247    │ │ 23        │ │ 8         │ │ 3         │         │
│ │ Total     │ │ Sales     │ │ Active    │ │ Pending   │         │
│ │ Earnings  │ │ All Time  │ │ Listings  │ │ Delivery  │         │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘         │
│                                                                  │
│ [ + Create New Listing ]                                         │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ RECENT SALES                                                     │
│                                                                  │
│ │ Dec 15 │ AI Email Assistant │ $149 │ @buyer123 │ ✓ Delivered │ │
│ │ Dec 14 │ SaaS Boilerplate   │ $49  │ @dev_guy  │ ✓ Delivered │ │
│ │ Dec 12 │ AI Email Assistant │ $149 │ @newuser  │ ⏳ Pending  │ │
│                                                                  │
│ [View All Sales →]                                               │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ MY LISTINGS                                                      │
│                                                                  │
│ │ AI Email Assistant   │ $149 │ Active │ 23 sales │ [Edit]     │ │
│ │ SaaS Boilerplate     │ $49  │ Active │ 45 sales │ [Edit]     │ │
│ │ Chrome Tab Manager   │ FREE │ Active │ 0 sales  │ [Edit]     │ │
│                                                                  │
│ [View All Listings →]                                            │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ MESSAGES (2 unread)                                              │
│                                                                  │
│ │ @curious_dev │ "Hey, quick question about..." │ 2 hours ago  │ │
│ │ @buyer123    │ "Thanks for the quick delivery" │ 1 day ago   │ │
│                                                                  │
│ [View All Messages →]                                            │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ PAYOUTS                                                          │
│                                                                  │
│ Stripe Account: Connected ✓                                      │
│ Available Balance: $347.00                                       │
│                                                                  │
│ [View in Stripe Dashboard →]                                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Legal & Disclaimers

### Terms of Service (Summary)

**The short version:**

1. **We're a marketplace, not a party to your transaction.** 
   - We connect buyers and sellers
   - We process payments
   - We take a cut
   - That's it

2. **All sales are final.**
   - Refunds are between buyer and seller
   - We don't mediate disputes
   - Chargebacks hurt sellers (and may get you banned)

3. **We don't verify anything.**
   - We don't check if code works
   - We don't verify ownership
   - We don't guarantee quality
   - Buyer beware

4. **Sellers are responsible for:**
   - Having rights to sell what they list
   - Delivering what they promise
   - Accurate descriptions
   - Customer support (if offered)

5. **We can remove anything.**
   - Illegal content
   - Copyright violations
   - Scams
   - Whatever else we deem necessary

6. **You can't sue us.**
   - Standard limitation of liability
   - Use at your own risk
   - Not legal/financial advice
   - etc.

### Disclaimer Banner (Shown on Listings)

```
┌────────────────────────────────────────────────────────────────┐
│ ⚠️ BUYER NOTICE: UndeadList is a community marketplace.        │
│ We do not verify listings, guarantee quality, or provide       │
│ refunds. Review carefully before purchasing. All sales final.  │
│ [Learn more]                                                   │
└────────────────────────────────────────────────────────────────┘
```

### Copyright / DMCA

- We respond to valid DMCA takedown requests
- File via email to dmca@undeadlist.com
- We remove first, ask questions later
- False claims get you banned

---

## What We Don't Do

### Things That Are NOT Our Problem

| Situation | Our Response |
|-----------|--------------|
| "The code doesn't work" | Talk to the seller |
| "It's not what I expected" | Should've read the description |
| "Seller isn't responding" | Not our problem (unless fraud) |
| "I want a refund" | Talk to the seller |
| "This is overpriced" | Don't buy it then |
| "The code is messy" | That's subjective |
| "I found a bug" | Contact the seller |
| "Seller is mean to me" | Block them, move on |

### Things That ARE Our Problem

| Situation | Our Response |
|-----------|--------------|
| Seller took money, never delivered | Investigate, ban if fraud |
| Listing contains malware | Remove immediately, ban seller |
| Stolen code / copyright violation | DMCA process, remove listing |
| Harassment / threats | Remove content, warn/ban user |
| Fake reviews / vote manipulation | Remove, warn/ban |
| Illegal content | Remove, report if required |

### The Bottom Line

We built the graveyard. We sweep the crypts and collect the toll. We don't inspect the merchandise, negotiate prices, or referee arguments. 

You're adults. Act like it.

---

## Future Considerations

### Maybe Later

- **Escrow for high-value sales** — Hold funds until delivery confirmed
- **Verified code review** — Pay extra for third-party review
- **Auction format** — Bid on listings
- **Bundles** — Sell multiple items together
- **Subscription listings** — Recurring payment for updates
- **API access** — Let others build on our marketplace
- **Affiliate program** — Earn for referrals

### Probably Never

- Refund processing (that's Stripe's job)
- Customer support for purchases
- Code hosting (use GitHub)
- Escrow for every sale (too much overhead)
- Identity verification for buyers
- Review before publishing (kills velocity)

---

*Ship fast, sell faster. Let's go.*
