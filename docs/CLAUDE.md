# CLAUDE.md

## Project Overview
MoneyChat — Chat-first family budget tracker. Users log expenses via Telegram bot, LLM parses natural language, data stored in Convex, web dashboard (SvelteKit) for visualization. Hosted on Cloudflare Pages.

## Key Principles
- **KISS** — Keep it simple. Don't over-engineer.
- **Chat-first** — The Telegram bot IS the primary interface. Web is secondary.
- **Natural language** — Users should never need to learn commands. LLM handles parsing.
- **Family groups** — Core differentiator. Every transaction belongs to a group.
- **Realtime** — Dashboard auto-updates when new transactions come in (powered by Convex).

## Tech Stack
- **Frontend:** SvelteKit 5 + Tailwind v4 + shadcn-svelte (bits-ui)
- **Backend + DB:** Convex (queries, mutations, actions, HTTP actions)
- **Telegram Bot:** Convex HTTP Actions (webhook mode)
- **LLM:** Pluggable — Gemini primary (supports images), swappable to Claude/OpenAI
- **Hosting:** Cloudflare Pages (frontend)
- **Package Manager:** bun (lockfile: bun.lock)

## Project Structure
```
convex/          → Backend: schema, functions, LLM integration, Telegram webhook
src/             → SvelteKit frontend (routes, components, lib)
src/lib/         → Shared utilities, Convex client, auth helpers
src/lib/components/ui/  → shadcn-svelte UI components
src/routes/      → SvelteKit pages (landing, dashboard, group detail)
docs/            → PRD, architecture, database schema
static/          → Static assets
```

## Development Commands
```bash
# Start Convex dev server (syncs functions to cloud)
npx convex dev

# Start SvelteKit frontend
bun run dev
# or: npm run dev

# Both together (in separate terminals)
npx convex dev          # Terminal 1
bun run dev             # Terminal 2

# Push Convex schema/functions to production
npx convex deploy

# Build frontend for Cloudflare Pages
bun run build

# Type check
bun run check
```

## Architecture Rules
1. **All backend logic lives in `convex/`** — No API routes in SvelteKit (except auth callback if needed)
2. **Telegram bot is a Convex HTTP Action** — Receives webhook, processes message, replies via Telegram API
3. **LLM calls happen in Convex Actions** — Actions can call external APIs (Gemini, etc.)
4. **Database reads/writes are Queries/Mutations** — Always type-safe, validated by schema
5. Every transaction MUST belong to a group
6. Users are identified by `telegramId` — no email/password auth
7. All amounts stored as number in IDR (no decimals)
8. Frontend uses `convex-svelte` for realtime subscriptions
9. Frontend authenticates via Telegram Login Widget → Convex session token

## LLM Usage Guidelines
- Primary provider: Gemini (fast, cheap, supports image/receipt)
- Provider is pluggable via `LLM_PROVIDER` env var
- Always request structured JSON output
- Include confidence score in response
- If confidence < 0.7, ask user for clarification via bot
- Image support: Gemini can parse receipt photos (future feature)

## Language & Locale
- Primary language: Bahasa Indonesia
- Parse "rb" = ribu = ×1000, "jt" = juta = ×1000000, "k" = ×1000
- Currency: IDR only (no decimals)
- Date parsing: "kemarin" = yesterday, "tadi" = today, "minggu lalu" = last week

## Code Style
- TypeScript everywhere (frontend + Convex functions)
- Svelte 5 runes (`$state`, `$derived`, `$effect`) — no legacy stores
- Functional style, no classes
- Commits: Conventional commits (feat:, fix:, docs:, etc.)
- No unnecessary abstractions — direct and readable code preferred

## Environment Variables
```bash
# Convex
CONVEX_DEPLOYMENT=...                 # Set by `npx convex dev`
VITE_CONVEX_URL=https://xxx.convex.cloud  # Public, used in frontend

# Convex environment variables (set via Convex dashboard)
TELEGRAM_BOT_TOKEN=...               # From BotFather
TELEGRAM_WEBHOOK_SECRET=...          # For verifying webhook
LLM_PROVIDER=gemini                  # gemini | claude | openai
GEMINI_API_KEY=...                   # Google AI API key
ANTHROPIC_API_KEY=...                # If using Claude (optional)
FRONTEND_URL=https://moneychat.pages.dev  # For dashboard links in bot messages
```

Note: Convex env vars diatur via `npx convex env set KEY value` atau Convex dashboard, bukan di `.env` file.

## Current Status
- [x] SvelteKit + Tailwind + shadcn-svelte setup
- [ ] Convex setup & schema
- [ ] Convex backend functions (queries, mutations)
- [ ] LLM parsing service (Gemini)
- [ ] Telegram bot webhook
- [ ] Cloudflare Pages adapter
- [ ] Frontend Convex client integration
- [ ] Telegram auth (web dashboard)
- [ ] Dashboard overview page
- [ ] Dashboard group detail + charts
- [ ] Budget tracking & alerts
- [ ] Deploy to production
