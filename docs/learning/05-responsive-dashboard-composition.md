# 05 — Responsive Dashboard Composition

## Masalah yang kita selesaikan

Dashboard desktop tidak bisa sekadar diperkecil. Urutan informasi harus berubah agar cerita analitis tetap masuk akal di layar sempit.

## Mental model

Responsive design adalah perubahan prioritas, bukan hanya perubahan ukuran. Desktop menyandingkan perbandingan; mobile menyusun reasoning chain secara vertikal.

## Peta file

- `app/page.tsx`: order dan span grid.
- `app/globals.css`: tokens serta global behavior.
- masing-masing dashboard component: internal responsive layout.
- `playwright.config.ts`: desktop dan mobile projects.

## Aliran data dan event

Data tidak berubah antar breakpoint. CSS mengubah order, columns, typography, dan navigation placement. State selection serta filter tetap sama.

## Keputusan penting

- Team Style Landscape muncul sebelum tabel liga pada mobile.
- Desktop memakai 12-column grid tanpa outer card.
- Analyst Brief berubah dari empat kolom menjadi evidence block vertikal.
- Mobile bottom navigation diberi ruang aman melalui page padding.

## Kesalahan yang sering terjadi

- Mengatur ukuran dengan JavaScript padahal CSS cukup.
- Menyembunyikan confidence atau limitations di mobile.
- Membiarkan tabel mendorong lebar dokumen.

## Latihan buat lo

Ubah breakpoint komposisi League State + landscape dari `xl` ke `lg`, lalu bandingkan pada viewport 1024px.

## Cara memverifikasi latihan

Jalankan Playwright dan pastikan assertion horizontal overflow tetap lulus:

```bash
npx playwright test -g "horizontal overflow"
```
