# 11 — Mengimpor Data Resmi J1 2025

## Kenapa memakai snapshot

Aplikasi tidak melakukan scraping setiap page dibuka. Importer dijalankan secara sadar, hasilnya direview sebagai JSON, lalu frontend dan backend membaca file yang sama. Ini membuat UI cepat, test deterministik, dan provenance bisa diaudit.

## Alur data

```text
J.LEAGUE final standings + team appearance pages + player directory
  → scripts/import_jleague_2025.py
  → data/jleague/2025.json
  → Zod validation / SQLAlchemy seed
  → API adapter
  → dashboard
```

## Apa yang dianggap resmi

- rank, points, wins, draws, losses, goals for/against;
- nama klub dan identitas pemain;
- appearances, minutes, goals, nomor punggung, posisi terdaftar;
- tanggal lahir dan ukuran tubuh saat tersedia.

`performance`, `potential`, `opportunity`, dan `availability` bukan statistik J.LEAGUE. Itu skor turunan J-Scout dan selalu diberi label di UI.

## Menjalankan importer

```bash
python3 scripts/import_jleague_2025.py
```

Importer menyimpan cache HTML di `/private/tmp/jleague-2025`, memvalidasi tepat 20 klub dan minimal 500 catatan pemain, serta gagal keras jika struktur sumber berubah. Setelah selesai, review diff `data/jleague/2025.json`; jangan langsung percaya hasil scraper.

## Kenapa ID pemain memakai klub

Pemain bisa pindah klub di tengah musim sehingga satu official player ID muncul pada dua team appearance page. ID record dibuat `officialPlayerId-teamSlug`. Ini mempertahankan kedua catatan klub tanpa menganggapnya dua manusia berbeda pada sumber.

## Menambah field baru

1. Parse field dari sumber resmi di importer.
2. Tambahkan validasi di `fixture-schema.ts`.
3. Tambahkan kolom SQLAlchemy dan migration Alembic.
4. Tambahkan field response Pydantic.
5. Mapping snake_case ke camelCase di `features/api/client.ts`.
6. Tambahkan test snapshot dan API.

## Guardrail penting

Jangan mengisi data yang tidak tersedia dengan angka yang terlihat masuk akal. Gunakan `null`, sembunyikan klaimnya, dan jelaskan limitation. Data kosong yang jujur lebih berguna daripada presisi palsu.
