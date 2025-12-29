# CLAUDE.md

## Project: UndeadList
Indie software marketplace - "the craigslist of Flippa/Acquire/Gumroad"
Japanese cyberpunk aesthetic / Tokyo underground dark theme

## Tech Stack
- Next.js 15.1.0 (App Router)
- React 19.0.0
- TypeScript 5.7.2
- PostgreSQL (Neon serverless)
- Prisma 6.1.0 ORM
- Stripe Connect (Express accounts)
- Cloudflare R2 (file storage)
- Resend (email)
- Twilio (SMS with email fallback)
- VirusTotal (file scanning)
- Upstash Redis (rate limiting)
- Sentry (error tracking)

## ABSOLUTE FORBIDDEN ACTIONS

1. **NEVER delete node_modules** - This has corrupted the project 4+ times
2. **NEVER run `pnpm install` without explicit user permission** - ASK FIRST
3. **NEVER use Windows PowerShell or CMD** - WSL only
4. **NEVER suggest "reinstalling dependencies" as a fix**
5. **NEVER expose phone numbers or API keys in code/logs**
6. **NEVER delete or heavily modify existing working files** - Create new files instead
7. **NEVER claim something is done without showing proof**
8. **NEVER run `pnpm prisma db seed`** - This runs test data scripts that can corrupt production
9. **NEVER run any command that deletes, truncates, or drops tables**
10. **NEVER run database commands without explicit user permission** - ASK FIRST

## DATABASE RULES

**CRITICAL: This is a PRODUCTION database. Treat it with extreme caution.**

- NEVER run `pnpm prisma db seed` - Use `prisma/seed-categories-only.ts` for category updates
- NEVER truncate or delete tables
- ALWAYS use upsert for reference data (categories, etc.)
- ALWAYS verify data counts before and after any DB operation
- ALWAYS ask user before running ANY database modification command
- For category updates ONLY: `pnpm tsx prisma/seed-categories-only.ts`

## Verification Requirements

**You must PROVE work is done, not just claim it.**

When fixing or building something:
1. Show the ACTUAL code snippet (use `cat` or `grep`)
2. Show the file path and line numbers
3. If claiming something is "already done" - prove it with code output

Example:
```bash
# WRONG: "I've updated the modal backgrounds"
# RIGHT: Show actual output:
grep -n "bg-zinc-900" src/components/ui/modal.tsx
# Output: src/components/ui/modal.tsx:53: 'bg-zinc-900 border...'
```

## Commands

- **Package manager:** `pnpm` (NEVER npm or yarn)
- **Dev server:** `pnpm dev --port 3001` (port 3000 is production)
- **Database push:** `pnpm prisma db:push`
- **Generate client:** `pnpm prisma generate`

## Working Directory

- All work happens in WSL
- Project path: `/home/jesse/shittySaas`
- Docker compose: `/home/jesse/docker/docker-compose.yml`

## Design System

- Theme: Japanese cyberpunk / Tokyo underground dark
- Primary cyan: #22d3ee
- Primary pink: #ff3366
- Dark backgrounds with neon glow effects
- Upvote: (Reanimate)
- Downvote: (Bury)
- Japanese tagline:

## Current Status

| Phase | Status |
|-------|--------|
| Phase 1 - Quick Wins | Complete |
| Phase 2 - Escrow | Complete |
| Phase 3 - VirusTotal | Complete |
| Phase 4 - Twilio | Complete (email fallback active) |
| Phase 5 - UI/Badges | Complete |
| Phase 6 - GitHub Verification | Complete |
| Phase 7 - Buyer Spend Limits | Complete |
| Phase 8 - Documentation | Complete (Dec 28, 2025) |
| Phase 9 - AI Guardian | Pending (schema fields exist) |
| Phase 10 - BackPage | Complete (community board) |

## Security Audit Remediation

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 0 - Emergency | **COMPLETE** | XSS fix (P1-001), Guest download auth (P1-006) |
| Phase 1 - Security Foundation | **COMPLETE** | Rate limiting (P1-002), Guest limits (P1-003), Escrow atomicity (P1-004), Dispute atomicity (P1-005), CSP headers (P1-007) |
| Phase 2 - Financial Integrity | **COMPLETE** | WWW redirect (P2-004), webhook try-catch (P2-007), cleanup cron (P2-008) |
| Phase 3 - Stability | **COMPLETE** | Pagination (P2-002, P2-003), CSRF (P2-001), health check (P2-006), enumeration fix (P2-005) |
| Phase 4 - Quality | **PARTIAL** | constants.ts done, logger.ts done, indexes pending |
| Dec 28 Fixes | **COMPLETE** | Guest JWT downloads, free claim routing, download links in emails |

## Key Reference Files

- `GOLDEN_ANCHOR.md` - Complete project state documentation
- `CHANGELOG.md` - Version history and changes
- `.claude/plans/` - Implementation plans
- `src/lib/` - Core business logic (18 modules)

## Before Making Changes

1. Read relevant existing code FIRST
2. Understand what's already built
3. Create NEW files rather than heavily modifying existing ones
4. TEST after each change
5. STOP if something breaks - don't chain fixes
6. SHOW proof that changes were made

## Environment Variables

See .env file. Never commit secrets. Never log sensitive values.
ADMIN_EMAIL defaults to undead1@gmail.com for alert fallback.
