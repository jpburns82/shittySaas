
## CRITICAL: SHELL ENVIRONMENT
This project MUST run from WSL bash only. 
NEVER run commands from Windows PowerShell or CMD.
All paths must start with /mnt/c/ not C:\
If you see "permission denied" or "tsx not found", you switched shells. STOP and alert user.
# UndeadList - Claude Code Guidelines

## IDENTITY CHECK
Before starting ANY work, confirm: "I am Claude Opus 4.5" 
If you are not Opus 4.5, STOP and alert the user.

## PROJECT COMMANDS - USE PNPM ONLY
This is a pnpm project. Never use npm or npx.
```bash
pnpm install        # Install dependencies
pnpm dev            # Start dev server
pnpm build          # Build for production
pnpm db:generate    # Generate Prisma client
pnpm db:migrate     # Run migrations
pnpm db:seed        # Seed database
pnpm db:studio      # Open Prisma Studio
```

**WRONG:** `npm install`, `npx prisma`, `npm run dev`
**RIGHT:** `pnpm install`, `pnpm db:seed`, `pnpm dev`

## ENVIRONMENT RULES
- Run ALL commands from the same terminal (WSL or Windows, never mix)
- If node_modules gets corrupted: `rm -rf node_modules .next && pnpm install && pnpm db:generate`
- After wiping node_modules, ALWAYS run `pnpm db:generate` before `pnpm dev`

## DO NOT
- Install new dependencies without explicit approval
- Modify package.json scripts
- Run npm/npx commands
- Mix WSL and Windows paths
- Create duplicate files or components
- Ask clarifying questions on simple tasks - just execute

## BEFORE EDITING
1. Read the file first
2. Understand existing patterns
3. Make minimal changes
4. Don't refactor unrelated code

## PROJECT STRUCTURE
- `/src/app` - Next.js App Router pages
- `/src/components` - React components
- `/prisma` - Database schema and seed
- `/public/images/seed` - Test listing images
- `/.claude` - Claude workspace files

## TEST ACCOUNTS
- Admin: (your existing account)
- Seller: ghostdev / Seller123!
- Buyer: zombiebuyer / Buyer123!

## CURRENT STATE
- App runs on localhost:3000
- 4 seed listings exist (AstraAI, BreakUpBot, Prometheus AI, Y2K Messenger)
- Seed images in `/public/images/seed/`