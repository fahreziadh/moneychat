# MoneyChat

Chat-first family budget tracker. Kirim pesan natural language ke Telegram bot, AI yang parse dan catat pengeluaranmu.

## What is this?

MoneyChat bikin tracking pengeluaran se-simple kirim chat. Ketik "makan siang 35rb" dan langsung tercatat — gak perlu buka app, pilih kategori, isi form.

Dirancang untuk **gen sandwich** yang perlu track spending untuk rumah tangga, ortu, mertua, dan anak secara terpisah lewat **family groups**.

## Features

- **Natural language input** — "makan siang 35rb", "kemarin bensin 50k", "obat mama 200rb"
- **AI-powered parsing** — LLM yang handle kategori, jumlah, tanggal, dan group detection
- **Family groups** — Pisahkan pengeluaran per group (Rumah Tangga, Ortu, Anak, dll)
- **Budget tracking** — Set budget per group, dapat warning kalau hampir habis
- **Rekap** — Ketik "rekap" untuk summary harian/mingguan/bulanan
- **Web dashboard** — Chart, breakdown, dan trend di browser (realtime!)
- **Receipt scanning** — Foto struk, AI yang baca (coming soon)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | SvelteKit 5 + Tailwind v4 + shadcn-svelte |
| Backend + DB | Convex |
| Bot | Telegram (via Convex HTTP Actions webhook) |
| AI/LLM | Gemini (pluggable) |
| Hosting | Cloudflare Pages |

## Concept

```
User (Telegram)
  │
  ▼
Convex HTTP Action (webhook)
  │
  ▼
LLM Parser (Gemini) ──→ Extract: amount, category, group, description
  │
  ▼
Convex Database ──→ transactions, users, groups, budgets
  │
  ▼
Chat Reply (formatted summary)
  │
  ▼
Web Dashboard (SvelteKit) ──→ Charts, rekap, family group management
```

## MVP Scope

### In Scope
- Telegram bot (free, no approval needed)
- Log expense via natural language chat
- Auto-categorize via LLM
- Family groups (shared budgets)
- Daily/weekly/monthly rekap via chat
- Simple web dashboard with charts
- Auth via Telegram (no separate login)

### Out of Scope (Later)
- WhatsApp integration
- OCR receipt scanning
- Multi-currency
- Export PDF/CSV
- Bank account sync
- Native mobile app

## Getting Started

### Prerequisites
- Node.js 18+ / bun
- Convex account (free at convex.dev)
- Telegram Bot Token (from @BotFather)
- Google AI API Key (for Gemini)

### Setup

```bash
# Clone & install
git clone <repo-url>
cd moneychat
bun install

# Setup Convex
npx convex dev

# Set Convex environment variables
npx convex env set TELEGRAM_BOT_TOKEN "your-bot-token"
npx convex env set GEMINI_API_KEY "your-gemini-key"
npx convex env set LLM_PROVIDER "gemini"
npx convex env set FRONTEND_URL "http://localhost:5173"

# Frontend env
echo 'VITE_CONVEX_URL=your-convex-url' > .env.local

# Run (2 terminals)
npx convex dev    # Terminal 1
bun run dev       # Terminal 2
```

## Documentation

- [PRD.md](docs/PRD.md) — Product requirements & user stories
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — Technical architecture & request flows
- [DATABASE.md](docs/DATABASE.md) — Convex schema reference
- [CLAUDE.md](docs/CLAUDE.md) — Development guide
