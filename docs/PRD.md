# Product Requirements Document (PRD)

## Project: MoneyChat
**Version:** MVP 1.0
**Target Users:** Personal — kamu & istri (expandable to public later)

---

## Problem Statement

Mencatat keuangan sehari-hari itu friction-nya tinggi: buka app, pilih kategori, input angka, save. Kebanyakan orang give up setelah seminggu. Gen sandwich punya complexity tambahan — harus track spending untuk rumah tangga, ortu, mertua, anak, secara terpisah tapi tetap visible.

## Solution

Chat-based expense tracker yang se-simple kirim pesan ke teman. User chat biasa, LLM yang handle sisanya.

---

## User Stories

### Core Logging
- **Sebagai user**, saya bisa kirim "makan siang 35rb" dan otomatis tercatat dengan kategori yang benar
- **Sebagai user**, saya bisa kirim dalam format apapun: "35k makan", "lunch 35000", "makan siang tiga puluh lima ribu"
- **Sebagai user**, saya bisa log untuk tanggal lain: "kemarin bensin 50rb"
- **Sebagai user**, saya bisa foto struk/receipt dan otomatis tercatat (via Gemini Vision)

### Family Groups
- **Sebagai user**, saya bisa buat family group (misal: "Rumah Tangga", "Ortu")
- **Sebagai user**, saya bisa invite istri ke group "Rumah Tangga"
- **Sebagai user**, saya bisa log ke group tertentu: "/ortu obat mama 200rb"
- **Sebagai user**, LLM bisa auto-suggest group berdasarkan context ("obat mama" → suggest Ortu group)

### Rekap & Insights
- **Sebagai user**, saya bisa ketik "rekap" untuk lihat summary hari ini
- **Sebagai user**, saya bisa ketik "rekap minggu" untuk summary mingguan
- **Sebagai user**, saya terima link ke web dashboard untuk chart detail

### Budget
- **Sebagai user**, saya bisa set budget per group per bulan
- **Sebagai user**, saya dapat warning kalau spending mendekati/melebihi budget

### Web Dashboard
- **Sebagai user**, saya bisa login via Telegram auth
- **Sebagai user**, saya bisa lihat spending chart per group
- **Sebagai user**, saya bisa lihat breakdown by category
- **Sebagai user**, saya bisa lihat trend bulanan
- **Sebagai user**, saya bisa manage groups & members

---

## Chat Commands Reference

| Input | Action |
|-------|--------|
| `makan siang 35rb` | Log expense, auto-categorize |
| `makan siang 35rb /rumahtangga` | Log to specific group |
| `/ortu obat mama 200rb` | Log to "Ortu" group |
| `rekap` | Today's summary |
| `rekap minggu` | Weekly summary |
| `rekap bulan` | Monthly summary |
| `budget 5jt` | Set monthly budget for default group |
| `budget ortu 3jt` | Set budget for specific group |
| `grup baru Anak` | Create new family group |
| `invite @username` | Invite member to current group |
| `grup` | List all groups |
| `hapus terakhir` | Delete last transaction |
| `help` | Show commands |

Natural language juga works — LLM akan parse intent dari apapun yang user kirim.

---

## Categories (Auto-detected by LLM)

| Category | Icon | Examples |
|----------|------|----------|
| Food & Beverage | 🍔 | makan, kopi, snack, lunch |
| Transport | 🚗 | bensin, grab, gojek, parkir, tol |
| Shopping | 🛍️ | baju, sepatu, tokopedia |
| Bills & Utilities | 💡 | listrik, air, wifi, pulsa |
| Health | 💊 | obat, dokter, RS, apotek |
| Entertainment | 🎬 | nonton, netflix, spotify |
| Education | 📚 | buku, kursus, sekolah |
| Transfer | 💸 | kirim uang, transfer |
| Other | 📦 | (fallback) |

---

## Non-Functional Requirements

- **Response time:** Bot reply < 3 seconds
- **Uptime:** 99% (acceptable for personal use)
- **Data privacy:** All data encrypted, no sharing to third parties
- **Language:** Bahasa Indonesia primary, English supported
- **Currency:** IDR only (MVP)
