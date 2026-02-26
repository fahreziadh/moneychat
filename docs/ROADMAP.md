# Roadmap MoneyChat

## Milestone 1: Foundation

Setup infrastruktur dasar supaya semua layer bisa berkomunikasi.

### 1.1 Setup Convex
- Install `convex` dan `convex-svelte`
- Jalankan `npx convex dev`, login, buat project
- Pastikan folder `convex/` terbentuk dengan `_generated/`

### 1.2 Convex Schema
- Definisikan semua tabel di `convex/schema.ts`: users, groups, groupMembers, transactions, budgets, sessions
- Definisikan semua index yang dibutuhkan
- Push schema, pastikan valid di Convex dashboard

### 1.3 Cloudflare Pages Adapter
- Install `@sveltejs/adapter-cloudflare`
- Ganti `adapter-auto` di `svelte.config.js`
- Test `bun run build` berhasil

### 1.4 Convex Client di Frontend
- Setup `convex-svelte` di `src/lib/convex.ts`
- Panggil `setupConvex()` di `+layout.svelte`
- Tambah `VITE_CONVEX_URL` ke `.env.local`
- Test: `useQuery` bisa connect ke Convex

---

## Milestone 2: Telegram Bot Core

Bot bisa terima pesan dan catat pengeluaran.

### 2.1 User & Group Mutations
- `convex/users.ts` — `upsert`, `getByTelegramId`, `setDefaultGroup`
- `convex/groups.ts` — `create`, `listByUser`, `getMembers`, `invite`
- `convex/groupMembers.ts` — helper queries
- Auto-create "Personal" group saat user pertama kali chat

### 2.2 Transaction CRUD
- `convex/transactions.ts` — `create`, `list`, `remove`
- `convex/transactions.ts` — `summary` (agregasi per kategori + period)
- `convex/budgets.ts` — `set`, `get`

### 2.3 LLM Service (Pluggable)
- Buat `convex/lib/llm/types.ts` — interface `ParsedExpense`, `LLMProvider`
- Buat `convex/lib/llm/gemini.ts` — implementasi Gemini (text + vision)
- Buat `convex/lib/llm/index.ts` — factory `getLLMProvider()` berdasarkan env `LLM_PROVIDER`
- System prompt untuk parse Bahasa Indonesia ("rb", "jt", "k", "kemarin", dll)
- Return JSON: amount, category, description, groupHint, date, confidence
- Support image input (receipt/struk) — Gemini Vision parse foto jadi transaksi

### 2.4 Telegram Webhook
- Buat `convex/http.ts` — HTTP route `POST /telegram-webhook`
- Buat `convex/telegram.ts` — action `handleMessage`:
  - Terima update dari Telegram
  - Upsert user
  - Deteksi tipe pesan: text atau foto
  - Text → kirim ke LLM parse → simpan transaksi
  - Foto → download dari Telegram API → kirim ke Gemini Vision → parse → simpan transaksi
  - Reply ke Telegram via `sendMessage` API
- Verifikasi webhook secret dari header
- Set webhook URL via Telegram API

### 2.5 Bot Command Handling
- Handle intent dari pesan:
  - Text biasa → parse expense
  - "rekap" / "rekap minggu" / "rekap bulan" → summary
  - "budget 5jt" → set budget
  - "grup baru [nama]" → create group
  - "hapus terakhir" → delete last transaction
  - "help" → kirim daftar command
- Jika LLM confidence < 0.7, minta klarifikasi ke user

---

## Milestone 3: Web Dashboard

Dashboard untuk visualisasi data pengeluaran.

### 3.1 Telegram Auth
- Buat `convex/auth.ts` — HTTP action `POST /auth/telegram`
  - Verify HMAC-SHA256 signature pakai bot token
  - Create/get user → generate session token
- Buat `src/lib/auth.ts` — client helpers (store token, check session)
- Halaman login dengan Telegram Login Widget

### 3.2 Dashboard Overview
- Route `src/routes/dashboard/+page.svelte`
- Tampilkan semua group user + total spending per group
- Spending chart (bulan ini)
- Budget progress bar per group
- Realtime update via `useQuery`

### 3.3 Group Detail Page
- Route `src/routes/dashboard/group/[id]/+page.svelte`
- Daftar transaksi (sortable by date)
- Breakdown by category (pie/donut chart)
- Budget status
- Filter by date range

### 3.4 Monthly Trends
- Query `transactions.monthlyTrends`
- Line chart: spending per bulan (6 bulan terakhir)
- Bisa filter per group atau semua group

---

## Milestone 4: Polish & Deploy

Finishing touches dan go live.

### 4.1 Landing Page
- Route `src/routes/+page.svelte`
- Penjelasan singkat MoneyChat
- CTA: link ke bot Telegram + login dashboard
- Responsive mobile-first

### 4.2 Budget Alerts (Bot)
- Setelah setiap transaksi, cek budget
- Kalau spending > 80% budget → kirim warning
- Kalau spending > 100% → kirim alert

### 4.3 Deploy Production
- Build SvelteKit: `bun run build`
- Deploy frontend ke Cloudflare Pages
- Deploy Convex: `npx convex deploy`
- Set semua env vars di Convex production
- Set Telegram webhook ke production URL
- Test end-to-end: chat → save → dashboard update

### 4.4 Group Management (Bot)
- Invite member via bot: "invite @username"
- List group: "grup"
- Switch default group: "default [nama-group]"
- Inline keyboard untuk konfirmasi group saat ambiguous

---

## Backlog (Post-MVP)

- Export CSV/PDF rekap bulanan
- Recurring expense tracking
- Multi-currency support
- WhatsApp integration
- Shared budget goals
- Notifikasi scheduled (rekap otomatis tiap malam)
