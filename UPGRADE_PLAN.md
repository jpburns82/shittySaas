# UndeadList - Complete MVP Upgrade Plan

Generated: 2025-12-23

## CRITICAL RULES

1. **NO REGRESSIONS** - Every existing feature must continue working
2. **CREATE NEW FILES** - Instead of heavily modifying existing ones
3. **TEST AFTER EACH CHANGE** - Verify before moving to next task
4. **STOP IF SOMETHING BREAKS** - Fix before continuing

---

## Phase 1: Quick Wins

### 1.1 Require Stripe Before Listing

**File:** src/app/api/listings/route.ts

Add check at START of POST handler (don't modify rest of logic):
```typescript
if (!session.user.stripeAccountId || !session.user.stripeOnboarded) {
  return NextResponse.json(
    { error: 'Please complete Stripe onboarding before creating listings' },
    { status: 403 }
  )
}
```

---

### 1.2 Listing Limits by Seller Tier

**NEW FILE:** src/lib/seller-limits.ts

```typescript
export async function getSellerListingLimit(userId: string): Promise<number> {
  const salesCount = await prisma.purchase.count({
    where: {
      listing: { sellerId: userId },
      status: 'COMPLETED'
    }
  })

  if (salesCount >= 10) return Infinity  // PRO
  if (salesCount >= 3) return 10         // TRUSTED
  if (salesCount >= 1) return 3          // VERIFIED
  return 1                                // NEW
}

export async function canCreateListing(userId: string): Promise<boolean> {
  const limit = await getSellerListingLimit(userId)
  const activeCount = await prisma.listing.count({
    where: {
      sellerId: userId,
      status: 'ACTIVE'
    }
  })
  return activeCount < limit
}
```

**Modify:** src/app/api/listings/route.ts - Add single check

---

### 1.3 Download Limits

**Schema Changes (prisma/schema.prisma):**
```prisma
model Purchase {
  // ... existing fields
  downloadCount   Int @default(0)
  maxDownloads    Int @default(10)
}
```

**NEW FILE:** src/lib/download-limiter.ts

```typescript
export async function canDownload(purchaseId: string): Promise<boolean> {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    select: { downloadCount: true, maxDownloads: true }
  })
  return purchase ? purchase.downloadCount < purchase.maxDownloads : false
}

export async function incrementDownloadCount(purchaseId: string): Promise<void> {
  await prisma.purchase.update({
    where: { id: purchaseId },
    data: { downloadCount: { increment: 1 } }
  })
}
```

**Modify:** src/app/api/download/[purchaseId]/route.ts - Add check + increment

---

## Phase 2: Escrow System

### 2.1 Schema Updates

```prisma
enum EscrowStatus {
  HOLDING
  DISPUTED
  RELEASED
  REFUNDED
}

enum DisputeReason {
  FILES_EMPTY
  NOT_AS_DESCRIBED
  SELLER_UNRESPONSIVE
  SUSPECTED_STOLEN
  MALWARE
  OTHER
}

enum SellerTier {
  NEW         // 0 sales, 1 active listing
  VERIFIED    // 1+ sales, 3 active listings
  TRUSTED     // 3+ sales, 10 active listings
  PRO         // 10+ sales OR manually granted, unlimited
}

model Purchase {
  // ... existing fields
  escrowStatus      EscrowStatus @default(HOLDING)
  escrowExpiresAt   DateTime?
  escrowReleasedAt  DateTime?
  disputedAt        DateTime?
  disputeReason     DisputeReason?
  disputeNotes      String?
  resolvedAt        DateTime?
  resolvedBy        String?
  resolution        String?
}

model User {
  // ... existing fields
  sellerTier      SellerTier @default(NEW)
  totalSales      Int @default(0)
  totalDisputes   Int @default(0)
  disputeRate     Float @default(0)
}
```

---

### 2.2 Dynamic Escrow Duration (Risk-Based)

| Scenario | Escrow Time | Why |
|----------|-------------|-----|
| Instant DL + Clean scan + Verified seller | Instant (0h) | Low risk |
| Instant DL + Clean scan + New seller | 24 hours | Buyer check time |
| Instant DL + New/unscanned | 72 hours | Higher risk |
| Repository Access | 72 hours | Verify access |
| Manual Transfer | 7 days (168h) | Complex handoff |
| Domain Transfer | 14 days (336h) | Registrar delays |

---

### 2.3 Domain Transfers - External Escrow

For sales >$2,000 or DOMAIN_TRANSFER category:
- Show message: "For your protection, we recommend using Escrow.com"
- Charge flat listing fee ($25-50) instead of percentage
- Platform not liable for the transfer

---

### 2.4 Escrow Utilities

**NEW FILE:** src/lib/escrow.ts

```typescript
import { DeliveryMethod, SellerTier, ScanStatus } from '@prisma/client'

interface EscrowParams {
  deliveryMethod: DeliveryMethod
  sellerTier: SellerTier
  scanStatus?: ScanStatus
}

export function getEscrowDurationHours(params: EscrowParams): number {
  const { deliveryMethod, sellerTier, scanStatus } = params

  // Instant DL + verified seller + clean scan = instant
  if (
    deliveryMethod === 'INSTANT_DOWNLOAD' &&
    sellerTier !== 'NEW' &&
    scanStatus === 'CLEAN'
  ) {
    return 0
  }

  // Instant DL + new seller or unscanned = 24-72h
  if (deliveryMethod === 'INSTANT_DOWNLOAD') {
    return sellerTier === 'NEW' ? 72 : 24
  }

  // Repository access = 72h
  if (deliveryMethod === 'REPOSITORY_ACCESS') return 72

  // Manual transfer = 7 days
  if (deliveryMethod === 'MANUAL_TRANSFER') return 168

  // Domain = 14 days
  if (deliveryMethod === 'DOMAIN_TRANSFER') return 336

  return 72 // default
}

export function calculateEscrowExpiry(params: EscrowParams): Date | null {
  const hours = getEscrowDurationHours(params)
  if (hours === 0) return null // Instant release
  return new Date(Date.now() + hours * 60 * 60 * 1000)
}

export function isEscrowExpired(escrowExpiresAt: Date | null): boolean {
  if (!escrowExpiresAt) return true
  return new Date() > escrowExpiresAt
}

export function canDispute(escrowStatus: string, escrowExpiresAt: Date | null): boolean {
  if (escrowStatus !== 'HOLDING') return false
  if (!escrowExpiresAt) return false
  return new Date() < escrowExpiresAt
}
```

---

### 2.5 Stripe Transfer Utilities

**NEW FILE:** src/lib/stripe-transfers.ts

```typescript
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function releaseToSeller(
  paymentIntentId: string,
  sellerAccountId: string,
  amountCents: number,
  purchaseId: string
): Promise<Stripe.Transfer> {
  return stripe.transfers.create({
    amount: amountCents,
    currency: 'usd',
    destination: sellerAccountId,
    source_transaction: paymentIntentId,
    metadata: { purchaseId }
  })
}

export async function refundBuyer(
  paymentIntentId: string,
  reason?: string
): Promise<Stripe.Refund> {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    reason: 'requested_by_customer',
    metadata: { reason: reason || 'Dispute refund' }
  })
}
```

---

### 2.6 Seller Tier Auto-Upgrade

In webhook after successful purchase:
```typescript
const salesCount = await prisma.purchase.count({
  where: { listing: { sellerId: seller.id }, status: 'COMPLETED' }
})

let newTier: SellerTier = 'NEW'
if (salesCount >= 10) newTier = 'PRO'
else if (salesCount >= 3) newTier = 'TRUSTED'
else if (salesCount >= 1) newTier = 'VERIFIED'

await prisma.user.update({
  where: { id: seller.id },
  data: { sellerTier: newTier, totalSales: salesCount }
})
```

---

### 2.7 Stripe Checkout Changes (MINIMAL)

**File:** src/app/api/stripe/checkout/route.ts

- Remove `transfer_data` from payment_intent_data (hold funds on platform)
- Add metadata: `{ sellerStripeAccountId, deliveryMethod }`

---

### 2.8 Webhook Changes (MINIMAL)

**File:** src/app/api/stripe/webhook/route.ts

In handleCheckoutCompleted, add:
```typescript
const escrowExpiry = calculateEscrowExpiry({
  deliveryMethod: listing.deliveryMethod,
  sellerTier: seller.sellerTier,
  scanStatus: listingFile?.scanStatus
})

await prisma.purchase.update({
  where: { id: purchase.id },
  data: {
    escrowStatus: escrowExpiry ? 'HOLDING' : 'RELEASED',
    escrowExpiresAt: escrowExpiry,
    escrowReleasedAt: escrowExpiry ? null : new Date()
  }
})

// If instant release, transfer immediately
if (!escrowExpiry) {
  await releaseToSeller(...)
}
```

---

### 2.9 New API Routes

**NEW:** src/app/api/purchases/[purchaseId]/dispute/route.ts
- POST: Buyer opens dispute
- Validates: buyer owns purchase, within escrow period
- Sets: escrowStatus = DISPUTED, disputedAt, disputeReason
- Notifies: admin, seller

**NEW:** src/app/api/admin/disputes/route.ts
- GET: List all disputes with pagination

**NEW:** src/app/api/admin/disputes/[purchaseId]/resolve/route.ts
- POST with action: 'release' | 'refund'
- If release: transfer funds to seller
- If refund: refund buyer via Stripe

---

### 2.10 Escrow Cron Job

**NEW:** src/app/api/cron/process-escrow/route.ts

```typescript
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find expired escrows ready for release
  const purchases = await prisma.purchase.findMany({
    where: {
      escrowStatus: 'HOLDING',
      escrowExpiresAt: { lt: new Date() }
    },
    include: { listing: { include: { seller: true } } }
  })

  let released = 0
  for (const purchase of purchases) {
    try {
      await releaseToSeller(...)
      await prisma.purchase.update({
        where: { id: purchase.id },
        data: {
          escrowStatus: 'RELEASED',
          escrowReleasedAt: new Date()
        }
      })
      // Send email to seller
      released++
    } catch (error) {
      console.error(`Failed to release escrow for ${purchase.id}:`, error)
    }
  }

  return NextResponse.json({ released })
}
```

---

## Phase 3: Virus Scanning

### 3.1 Schema Updates

```prisma
enum ScanStatus {
  PENDING
  SCANNING
  CLEAN
  SUSPICIOUS
  MALICIOUS
  ERROR
  SKIPPED
}

model ListingFile {
  // ... existing fields
  fileHash      String?
  scanStatus    ScanStatus @default(PENDING)
  scanResult    Json?
  scannedAt     DateTime?
  detections    Int @default(0)
  totalEngines  Int @default(0)
  vtAnalysisId  String?

  @@index([fileHash])
  @@index([scanStatus])
}

enum ListingStatus {
  // ... existing
  PENDING_SCAN
  PENDING_REVIEW
}
```

---

### 3.2 VirusTotal Utility

**NEW FILE:** src/lib/virustotal.ts

```typescript
import crypto from 'crypto'

const VT_API_URL = 'https://www.virustotal.com/api/v3'

export function getFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

export async function checkHashReputation(hash: string): Promise<ScanResult> {
  const response = await fetch(`${VT_API_URL}/files/${hash}`, {
    headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY! }
  })

  if (response.status === 404) {
    return { status: 'UNKNOWN' }
  }

  const data = await response.json()
  return parseScanResult(data)
}

export async function uploadForScan(buffer: Buffer, filename: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', new Blob([buffer]), filename)

  const response = await fetch(`${VT_API_URL}/files`, {
    method: 'POST',
    headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY! },
    body: formData
  })

  const data = await response.json()
  return data.data.id // analysis ID
}

export async function getAnalysisResults(analysisId: string): Promise<ScanResult> {
  const response = await fetch(`${VT_API_URL}/analyses/${analysisId}`, {
    headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY! }
  })

  const data = await response.json()
  return parseScanResult(data)
}

function parseScanResult(data: any): ScanResult {
  const stats = data.data?.attributes?.stats || data.data?.attributes?.last_analysis_stats
  const malicious = stats?.malicious || 0
  const suspicious = stats?.suspicious || 0
  const total = Object.values(stats || {}).reduce((a: number, b: any) => a + b, 0)

  let status: ScanStatus = 'CLEAN'
  if (malicious > 0) status = 'MALICIOUS'
  else if (suspicious > 0) status = 'SUSPICIOUS'

  return { status, detections: malicious + suspicious, totalEngines: total }
}
```

---

### 3.3 Upload Integration (MINIMAL)

**File:** src/app/api/listings/[id]/files/route.ts

After R2 upload succeeds:
```typescript
const buffer = await file.arrayBuffer()
const hash = getFileHash(Buffer.from(buffer))
const scanResult = await scanFile(Buffer.from(buffer), file.name)

if (scanResult.status === 'MALICIOUS') {
  await deleteFile(fileKey) // Delete from R2
  return NextResponse.json({ error: 'File flagged as malicious' }, { status: 400 })
}

await prisma.listingFile.update({
  where: { id: listingFile.id },
  data: {
    fileHash: hash,
    scanStatus: scanResult.status,
    detections: scanResult.detections,
    totalEngines: scanResult.totalEngines,
    scannedAt: new Date()
  }
})
```

---

### 3.4 Scan Processing Cron

**NEW:** src/app/api/cron/process-scans/route.ts

Runs every 5 minutes:
- Find files with scanStatus = SCANNING and vtAnalysisId
- Poll getAnalysisResults for each
- Update scanStatus, detections, scannedAt
- Update listing status if suspicious/malicious

---

## Phase 4: Twilio SMS Alerts

### 4.1 Twilio Utility

**NEW FILE:** src/lib/twilio.ts

```typescript
import twilio from 'twilio'

const client = process.env.TWILIO_ACCOUNT_SID
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

export async function alertAdmin(message: string): Promise<void> {
  if (!client || !process.env.ADMIN_PHONE_NUMBER) {
    console.log('[ALERT]', message)
    return
  }

  try {
    await client.messages.create({
      body: `[UndeadList] ${message}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.ADMIN_PHONE_NUMBER
    })
  } catch (error) {
    console.error('Twilio alert failed:', error)
  }
}
```

---

### 4.2 Notification Matrix

| Event | Email Seller | Email Buyer | Twilio Admin |
|-------|--------------|-------------|--------------|
| Purchase complete | Sale notification | Receipt + escrow info | Only if >$500 |
| Dispute opened | Issue reported | Report received | Alert |
| Escrow released | Funds released | Purchase complete | - |
| Dispute resolved | Outcome | Outcome | Resolved |
| File flagged | Listing paused | - | Alert |
| New seller first listing | - | - | Review needed |

---

## Phase 5: Trust & Limits UI

### 5.1 Badge Visual Design

| Badge | Meaning | Style |
|-------|---------|-------|
| NEW SELLER | 0 sales | Gray, subtle |
| VERIFIED | 1+ sales | Cyan border (#22d3ee) |
| TRUSTED | 3+ sales | Green glow |
| PRO | 10+ sales | Gold/yellow |
| SCANNED | File passed | Green checkmark |
| GITHUB | Repo verified | GitHub icon + check |
| FEATURED | Promoted | Pink star (#ff3366) |
| PROTECTED | Has escrow | Shield icon |

Cyberpunk/neon style:
- Pill-shaped with subtle glow
- Primary colors: cyan (#22d3ee) and pink (#ff3366)

---

### 5.2 New Components

**Badge Components:**
- src/components/ui/badges/seller-tier-badge.tsx
- src/components/ui/badges/scan-badge.tsx
- src/components/ui/badges/github-badge.tsx
- src/components/ui/badges/featured-badge.tsx
- src/components/ui/badges/protected-badge.tsx

**UI Components:**
- src/components/ui/escrow-status.tsx (countdown, status)
- src/components/ui/download-counter.tsx (3/10 downloads)
- src/components/purchases/report-issue-modal.tsx (dispute form)

**Pages:**
- src/app/admin/disputes/page.tsx (dispute management)

---

### 5.3 Page Updates (MINIMAL)

- dashboard/purchases: Add EscrowStatus, DownloadCounter
- dashboard/sales: Add payout status display
- listing-card: Add SellerTierBadge
- dashboard: Add listing limit display
- admin sidebar: Add link to /admin/disputes

---

## Phase 6: GitHub Verification

### 6.1 Schema Updates

```prisma
model User {
  // ... existing fields
  githubId          String?
  githubUsername    String?
  githubVerifiedAt  DateTime?
}
```

---

### 6.2 GitHub Utility

**NEW FILE:** src/lib/github.ts

```typescript
export async function verifyRepoOwnership(
  accessToken: string,
  repoUrl: string
): Promise<boolean> {
  // Parse owner/repo from URL
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
  if (!match) return false

  const [, owner, repo] = match

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })

  if (!response.ok) return false

  const data = await response.json()
  return data.permissions?.admin === true
}
```

---

### 6.3 Components

**NEW:** src/components/settings/github-connect.tsx

---

## Phase 7: Buyer Spend Limits

### 7.1 Utility

**NEW FILE:** src/lib/buyer-limits.ts

```typescript
export function getDailySpendLimit(isVerified: boolean): number {
  return isVerified ? 100000 : 25000 // $1000 or $250 in cents
}

export async function getTodaySpend(userId: string): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const purchases = await prisma.purchase.aggregate({
    where: {
      buyerId: userId,
      status: 'COMPLETED',
      createdAt: { gte: today }
    },
    _sum: { priceCents: true }
  })

  return purchases._sum.priceCents || 0
}

export async function canPurchase(userId: string, amountCents: number): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return false

  const limit = getDailySpendLimit(user.isVerifiedSeller)
  const spent = await getTodaySpend(userId)

  return spent + amountCents <= limit
}
```

---

### 7.2 Checkout Integration

**File:** src/app/api/stripe/checkout/route.ts

Add before creating session:
```typescript
if (!(await canPurchase(session.user.id, priceCents))) {
  return NextResponse.json(
    { error: 'Daily spending limit reached' },
    { status: 403 }
  )
}
```

---

## Phase 8: Documentation

### 8.1 Update Terms of Service
- Add escrow section
- Add refund policy (72h review period for instant downloads)
- Add dispute process
- Add prohibited content (malware, stolen code)

### 8.2 Update FAQ
- How does buyer protection work?
- When do sellers get paid?
- What are the listing limits?
- How do I dispute a purchase?

### 8.3 Update README
- Current features
- All environment variables
- Setup instructions

---

## Phase 9: AI Guardian Bot (Tiered)

Two-tier AI moderation system for cost-effective content analysis.

### 9.1 Architecture

```
Listing Created
      ↓
┌─────────────────┐
│  Gemini Flash   │  (~1 sec, free)
│  Quick Scan     │
└────────┬────────┘
         ↓
    ┌────┴────┐
    │ Result? │
    └────┬────┘
         │
    ┌────┼────────────────┐
    ↓    ↓                ↓
  CLEAN  LOW           MEDIUM/HIGH/CRITICAL
    │    │                │
    ↓    ↓                ↓
 Auto-  Auto-      ┌──────────────┐
 approve approve   │    Claude    │  (~3 sec, ~$0.01)
         + log     │  Deep Scan   │
                   └──────┬───────┘
                          ↓
                   ┌──────┴──────┐
                   │   Result?   │
                   └──────┬──────┘
                          │
              ┌───────────┼───────────┐
              ↓           ↓           ↓
           APPROVE     REVIEW      REJECT
              │           │           │
              ↓           ↓           ↓
           Active    PENDING +    Rejected +
                     SMS alert    SMS alert
```

**Cost Estimate:**
- 100 listings, 90% clean: ~$0.10 (only 10 Claude calls)
- 100 listings, 50% flagged: ~$0.50 (50 Claude calls)

### 9.2 Install Dependencies

```bash
pnpm add @anthropic-ai/sdk
```

### 9.3 Create Guardian Utility

**NEW FILE:** src/lib/guardian.ts

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'
import Anthropic from '@anthropic-ai/sdk'
import { alertAdmin } from './twilio'

const gemini = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)
const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface GuardianResult {
  risk_score: number
  risk_level: 'CLEAN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  flags: string[]
  recommendation: 'APPROVE' | 'REVIEW' | 'REJECT'
  reason: string
  model_used: 'gemini' | 'claude'
}

// Tier 1: Gemini Quick Scan (free, fast)
async function geminiQuickScan(listing: ListingData): Promise<{
  risk_level: string
  flags: string[]
  needs_deep_scan: boolean
}>

// Tier 2: Claude Deep Analysis (paid, smarter)
async function claudeDeepScan(listing: ListingData, initialFlags: string[]): Promise<GuardianResult>

// Main function - calls Gemini first, escalates to Claude if needed
export async function analyzeListing(listing: ListingData): Promise<GuardianResult>
```

### 9.4 Schema Updates

Add to Listing model:
```prisma
guardianScore      Int?
guardianFlags      String[]
guardianModel      String?       // 'gemini' or 'claude'
guardianReviewedAt DateTime?
guardianReason     String?
```

### 9.5 Integration

**File:** src/app/api/listings/route.ts

After validation, before saving:
```typescript
// Run AI Guardian analysis
const guardianResult = await analyzeListing({
  title: data.title,
  description: data.description,
  price: data.priceInCents / 100,
  category: data.categoryId,
  deliveryMethod: data.deliveryMethod,
  seller: { sellerTier: user.sellerTier, totalSales: user.totalSales }
})

// Set status based on recommendation
let status = 'DRAFT'
if (guardianResult.recommendation === 'REJECT') {
  return NextResponse.json({
    success: false,
    error: `Listing rejected: ${guardianResult.reason}`,
    data: { guardianResult }
  }, { status: 400 })
}

if (guardianResult.recommendation === 'REVIEW') {
  status = 'PENDING_REVIEW'
}
```

### 9.6 Red Flags Detected

**Automatic Rejection:**
- Guaranteed income claims
- Crypto/trading bot promises
- Account selling
- Passive revenue guarantees
- Vague description + high price

**Manual Review:**
- Unrealistic pricing
- Suspicious keywords
- New seller + high price

### 9.7 Environment Variable

```env
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Cron Job Setup

**Platform:** cron-job.org (free, reliable, 24/7)

**Endpoints:**
```
GET https://undeadlist.com/api/cron/process-escrow
GET https://undeadlist.com/api/cron/process-scans
Header: Authorization: Bearer {CRON_SECRET}
```

**Schedule:**
- process-escrow: Every hour
- process-scans: Every 5 minutes

---

## Environment Variables to Add

```env
# Twilio SMS
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
ADMIN_PHONE_NUMBER=

# VirusTotal
VIRUSTOTAL_API_KEY=

# Cron Security
CRON_SECRET=

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# AI Guardian (Claude)
ANTHROPIC_API_KEY=
```

---

## New Files Summary (25 files)

**Libraries (9):**
| File | Purpose |
|------|---------|
| src/lib/seller-limits.ts | Listing limit logic |
| src/lib/download-limiter.ts | Download counting |
| src/lib/escrow.ts | Dynamic escrow calculations |
| src/lib/stripe-transfers.ts | Release/refund functions |
| src/lib/virustotal.ts | Virus scanning |
| src/lib/twilio.ts | SMS alerts |
| src/lib/github.ts | GitHub verification |
| src/lib/buyer-limits.ts | Spend limits |
| src/lib/guardian.ts | AI Guardian (Gemini + Claude tiered) |

**Badge Components (5):**
| File | Purpose |
|------|---------|
| src/components/ui/badges/seller-tier-badge.tsx | NEW/VERIFIED/TRUSTED/PRO |
| src/components/ui/badges/scan-badge.tsx | CLEAN/PENDING/SUSPICIOUS |
| src/components/ui/badges/github-badge.tsx | GitHub verified |
| src/components/ui/badges/featured-badge.tsx | Featured star |
| src/components/ui/badges/protected-badge.tsx | Buyer protection shield |

**UI Components (3):**
| File | Purpose |
|------|---------|
| src/components/ui/escrow-status.tsx | Escrow countdown |
| src/components/ui/download-counter.tsx | Download progress |
| src/components/purchases/report-issue-modal.tsx | Dispute form |

**Pages (1):**
| File | Purpose |
|------|---------|
| src/app/admin/disputes/page.tsx | Admin dispute management |

**API Routes (5):**
| File | Purpose |
|------|---------|
| src/app/api/purchases/[purchaseId]/dispute/route.ts | Buyer opens dispute |
| src/app/api/admin/disputes/route.ts | List all disputes |
| src/app/api/admin/disputes/[purchaseId]/resolve/route.ts | Resolve dispute |
| src/app/api/cron/process-escrow/route.ts | Auto-release escrow |
| src/app/api/cron/process-scans/route.ts | Poll VirusTotal |

**Settings (1):**
| File | Purpose |
|------|---------|
| src/components/settings/github-connect.tsx | GitHub OAuth |

---

## Implementation Order

1. [ ] Create GOLDEN_ANCHOR.md
2. [ ] Create UPGRADE_PLAN.md
3. [ ] Commit docs
4. [ ] Phase 1.1 - Stripe check
5. [ ] Phase 1.2 - Listing limits
6. [ ] Phase 1.3 - Download limits
7. [ ] TEST Phase 1
8. [ ] Phase 2 - Escrow system
9. [ ] TEST Phase 2
10. [ ] Phase 3 - VirusTotal
11. [ ] TEST Phase 3
12. [ ] Phase 4 - Twilio alerts
13. [ ] Phase 5 - UI components
14. [ ] Phase 6 - GitHub verification
15. [ ] Phase 7 - Buyer spend limits
16. [ ] Phase 8 - Documentation
17. [ ] FULL TEST
18. [ ] Final commit

---

## Critical Files to Modify (Minimal Changes)

| File | Change |
|------|--------|
| src/app/api/listings/route.ts | Add Stripe + limit checks at start |
| src/app/api/download/[purchaseId]/route.ts | Add download count check |
| src/app/api/stripe/checkout/route.ts | Remove transfer_data, add metadata |
| src/app/api/stripe/webhook/route.ts | Set escrow fields on checkout |
| src/app/api/listings/[id]/files/route.ts | Add scan call after upload |
| prisma/schema.prisma | Add enums + fields (no removals) |
