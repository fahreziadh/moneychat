# Prompt: Setup GitHub Project Management

Copy-paste prompt di bawah ini ke Claude Code untuk membuat milestones dan issues di GitHub.

---

## Prompt

```
Baca file docs/ROADMAP.md di repo ini. Berdasarkan isinya, lakukan:

1. Buat 4 GitHub Milestones menggunakan `gh api`:
   - "Milestone 1: Foundation" — Setup infrastruktur dasar
   - "Milestone 2: Telegram Bot Core" — Bot bisa terima pesan dan catat pengeluaran
   - "Milestone 3: Web Dashboard" — Dashboard visualisasi data
   - "Milestone 4: Polish & Deploy" — Finishing dan go live

2. Buat GitHub Issues untuk SETIAP sub-item di ROADMAP.md (1.1, 1.2, dst).
   Aturan:
   - Title: padat
   - Body: tulis dalam Bahasa Indonesia, format markdown
   - Setiap issue WAJIB punya:
     - Deskripsi singkat (1-2 kalimat) tentang apa yang harus dilakukan
     - Checklist (`- [ ]`) dari task spesifik yang ada di ROADMAP.md
     - Section "Referensi" yang link ke docs yang relevan (ARCHITECTURE.md, DATABASE.md, dll) menggunakan relative path
   - Assign ke milestone yang sesuai
   - Tambahkan label: gunakan kombinasi dari `enhancement`, `setup`, `bot`, `frontend`, `backend`, `documentation`
     - Buat label-label ini dulu kalau belum ada
   - Jangan terlalu panjang — padat dan actionable

3. Buat 1 issue tambahan untuk Backlog (post-MVP items dari ROADMAP.md), assign tanpa milestone.

Pastikan semua issue terbuat dengan benar. Jalankan `gh issue list` di akhir untuk verifikasi.
```
