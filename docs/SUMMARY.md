# Summary Progress MoneyChat

Terakhir diupdate: 2026-02-27

---

## Status Milestone

| Milestone | Status | Progress |
|-----------|--------|----------|
| 1: Foundation | Selesai | 4/4 issues closed |
| 2: Telegram Bot Core | Selesai | 5/5 issues closed |
| 3: Web Dashboard | Belum mulai | 0/4 issues |
| 4: Polish & Deploy | Belum mulai | 0/4 issues |

---

## Apa yang Sudah Dikerjakan

### Milestone 1: Foundation

- **Setup Convex** (#1) — Convex terinstall, project terhubung, folder `convex/_generated/` ready
- **Convex Schema** (#2) — 6 tabel didefinisikan: `users`, `groups`, `groupMembers`, `transactions`, `budgets`, `sessions`. Ditambahkan `imageId` (optional, Convex file storage) di `transactions` untuk simpan foto struk
- **Cloudflare Pages Adapter** (#3) — Ganti `adapter-auto` ke `@sveltejs/adapter-cloudflare`, build verified
- **Convex Client di Frontend** (#4) — `convex-svelte` di-setup di `src/lib/convex.ts`, dipanggil di `+layout.svelte`

### Milestone 2: Telegram Bot Core

- **User & Group Mutations** (#5) — CRUD user (`upsert`, `getByTelegramId`, `setDefaultGroup`), group (`create`, `listByUser`, `getMembers`, `invite`), groupMembers (helper queries). Auto-create "Personal" group untuk user baru
- **Transaction CRUD & Budget** (#6) — `transactions.create/list/remove/summary`, `budgets.set/get` (upsert by group+month+year)
- **LLM Service** (#7) — Refactored dari custom fetch ke **Convex Agent component** (`@convex-dev/agent`) + **AI SDK** (`@ai-sdk/google`). Expense parsing pakai `generateObject` dengan Zod schema. Model: `gemini-3.1-flash-image-preview` (support image/receipt)
- **Telegram Webhook** (#8) — `convex/http.ts` route `POST /telegram-webhook` dengan secret verification. `convex/telegram.ts` action: upsert user, detect text/foto, parse via agent, simpan transaksi, reply
- **Bot Command Handling** (#9) — Intent detection untuk: expense parsing (text & foto), rekap (hari/minggu/bulan), set budget, buat group baru, hapus transaksi terakhir, help

---

## Perubahan Arsitektur dari Rencana Awal

### LLM: Custom fetch → Convex Agent Component
Awalnya direncanakan custom `LLMProvider` class dengan manual `fetch` ke Gemini API. Di-refactor ke `@convex-dev/agent` karena:
- Thread & message history persistent otomatis
- Structured output via Zod schema (`generateObject`)
- Retry & streaming built-in
- Mudah swap provider (ganti model saja)

### Dependencies Ditambahkan
- `@convex-dev/agent` — Agent framework
- `@ai-sdk/google` — Gemini via AI SDK
- `ai` — Vercel AI SDK core
- `zod` — Schema validation untuk structured LLM output

### Environment Variables
- `GOOGLE_GENERATIVE_AI_API_KEY` — Menggantikan `GEMINI_API_KEY` (karena pakai AI SDK)
- `TELEGRAM_BOT_TOKEN` — Token dari BotFather
- `TELEGRAM_WEBHOOK_SECRET` — Untuk verifikasi webhook

---

## File-file Utama yang Dibuat/Diubah

```
convex/
├── convex.config.ts          [BARU] Agent component registration
├── schema.ts                 [DIUBAH] Tambah imageId di transactions
├── users.ts                  [SUDAH ADA] upsert, getByTelegramId, setDefaultGroup
├── groups.ts                 [BARU] create, listByUser, getMembers, invite
├── groupMembers.ts           [BARU] getByUserAndGroup, listByUser, listByGroup
├── transactions.ts           [BARU] create, list, remove, summary
├── budgets.ts                [BARU] set, get
├── telegram.ts               [BARU] handleMessage + command handlers
├── http.ts                   [BARU] POST /telegram-webhook
└── lib/llm/
    ├── types.ts              [BARU] Zod schema, system prompt
    ├── gemini.ts             [BARU] expenseAgent (Convex Agent + Gemini)
    └── index.ts              [BARU] re-exports

src/
├── lib/convex.ts             [BARU] initConvex() setup
└── routes/+layout.svelte     [DIUBAH] Panggil initConvex()

svelte.config.js              [DIUBAH] adapter-auto → adapter-cloudflare
```

---

## Apa yang Perlu Dikerjakan Selanjutnya

### Milestone 3: Web Dashboard (4 issues)

| Issue | Judul | Catatan |
|-------|-------|---------|
| #10 | Telegram Auth untuk Web | Verify HMAC-SHA256, session token, Telegram Login Widget |
| #11 | Dashboard Overview | Semua group + spending chart + budget progress |
| #12 | Group Detail Page | Daftar transaksi, breakdown category, filter date |
| #13 | Monthly Trends Chart | Line chart 6 bulan terakhir |

### Milestone 4: Polish & Deploy (4 issues)

| Issue | Judul | Catatan |
|-------|-------|---------|
| #14 | Landing Page | CTA ke bot + login dashboard, mobile-first |
| #15 | Budget Alerts via Bot | Warning di 80%, alert di 100% |
| #16 | Deploy Production | Build, deploy CF Pages + Convex, set webhook |
| #17 | Group Management via Bot | Invite, list, switch default group |

### Backlog Post-MVP (#18)
- Export CSV/PDF rekap bulanan
- Recurring expense tracking
- Multi-currency support
- WhatsApp integration
- Shared budget goals
- Notifikasi scheduled

---

## Potensi Risiko & Hal yang Perlu Diperhatikan

1. **Telegram Login Widget** — Perlu domain yang sudah di-set di BotFather (`/setdomain`). Untuk development, bisa pakai localhost tapi perlu workaround
2. **Convex Agent cold start** — First request mungkin lebih lambat. Untuk Telegram bot ini tidak masalah karena async
3. **Image parsing** — Gemini Vision bisa gagal parse struk yang blur/tidak jelas. Confidence score membantu filter ini
4. **Rate limiting** — Belum ada rate limiting untuk bot. Convex Agent component support rate limiting — bisa ditambahkan nanti
5. **Session expiry** — Perlu decide berapa lama session token valid dan mekanisme refresh
