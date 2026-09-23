# 10 — Menghubungkan Frontend ke API Tanpa Membuat UI Rapuh

## Tujuan

Frontend sebelumnya membaca fixture berbentuk camelCase. API mengirim snake_case. Adapter di `features/api/client.ts` menjadi boundary di antara keduanya.

## 1. Jangan sebarkan response API ke seluruh component

Component tetap membaca `LeagueDataset`. Hanya adapter yang tahu bahwa API memakai `snapshot_date`, `short_name`, atau `source_player_id`.

```text
FastAPI JSON → mapping adapter → Zod validation → LeagueDataset → analytics → UI
```

Jika backend berubah, perbaikannya terpusat. Analytics dan component tidak perlu ikut dirombak.

## 2. Validasi setelah mapping

TypeScript hilang saat runtime. Karena itu hasil mapping tetap masuk ke `leagueDatasetSchema.parse(...)`. Response yang tidak sesuai kontrak ditolak sebelum mencemari chart.

## 3. Fallback yang jujur

`useLeagueDataset()` mulai dari snapshot resmi lokal, mencoba API, lalu mengganti dataset ketika request berhasil. Hook yang sama dipakai League, Teams, Players, Moneyball, dan Compare supaya seluruh workflow membaca kontrak yang konsisten. UI overview selalu menampilkan sumber:

- `API connected`; atau
- `local fallback`.

Fallback dan API membaca snapshot yang sama, tetapi label sumber tetap ditampilkan agar pengguna tahu jalur data yang sedang aktif.

## 4. Abort request saat component dibongkar

`AbortController` mencegah request lama menulis state setelah user pindah page. Cleanup kecil ini penting saat navigation cepat atau hot reload.

## 5. Mengganti alamat API

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Restart Next.js setelah mengubah `.env.local`, karena public environment variable dibundel ke client.

## Latihan

Refactor page Teams agar memakai endpoint `/api/v1/teams`, tetapi tetap mempertahankan fixture fallback dan label provenance. Tambahkan test ketika API mengembalikan HTTP 500.
