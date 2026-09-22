# 02 — Data Contracts dan Analytics

## Masalah yang kita selesaikan

UI statistik mudah terlihat meyakinkan walaupun datanya rusak. J-Scout memvalidasi fixture sebelum dipakai dan memisahkan kalkulasi dari komponen React.

## Mental model

Alurnya adalah **unknown input → validated domain → pure calculations → view model → UI**. Komponen tidak boleh mengarang rumus sendiri.

## Peta file

- `features/league-intelligence/types.ts`: bahasa domain.
- `fixture-schema.ts`: validasi runtime dengan Zod.
- `sample-data.ts`: fixture fiktif berlabel sample.
- `analytics.ts`: fungsi murni pembentuk insight.
- `analytics.test.ts`: aturan statistik yang dikunci test.

## Aliran data dan event

`sampleLeagueDataset` hanya diekspor setelah melewati `leagueDatasetSchema.parse`. `buildLeagueDashboard` menerima dataset tervalidasi dan pilihan filter, lalu menghasilkan satu view model untuk seluruh halaman.

## Keputusan penting

- Missing value adalah `null`, bukan `0`.
- Landscape mengecualikan klub hanya jika sumbu yang dibutuhkan hilang; League State tetap dapat menampilkannya.
- Ranking recruitment mensyaratkan minutes dan coverage minimum.
- Sorting memakai ID sebagai tie-breaker supaya hasil deterministik.

## Kesalahan yang sering terjadi

- Mengubah persentase menjadi per-90.
- Mengisi data hilang dengan nol.
- Membandingkan pemain tanpa position group.
- Menulis insight sebagai copy statis yang tidak berubah saat data berubah.

## Latihan buat lo

Tambahkan formatter `signedDecimal` yang menampilkan `+0.35`, `-0.21`, atau `Not available`.

## Cara memverifikasi latihan

Tambahkan tiga test di `analytics.test.ts`, lalu jalankan:

```bash
npm test -- features/league-intelligence/analytics.test.ts
```
