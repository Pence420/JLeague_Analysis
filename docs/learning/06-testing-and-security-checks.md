# 06 — Testing dan Security Checks

## Masalah yang kita selesaikan

UI yang terlihat selesai belum tentu aman atau benar. Vertical slice ini mengunci kalkulasi, interaction, responsive behavior, accessibility, metadata, dan error disclosure.

## Mental model

Gunakan lapisan verifikasi: unit test untuk aturan data, component test untuk behavior, Playwright untuk browser nyata, build untuk integrasi, lalu source scan untuk pola berisiko.

## Peta file

- `*.test.ts` dan `*.test.tsx`: unit/component tests.
- `e2e/league-intelligence.spec.ts`: browser journey dan axe scan.
- `next.config.ts`: security headers.
- `app/error.tsx`: error copy yang tidak bocor.
- `.gitignore`: environment file dan output build.

## Aliran data dan event

Vitest berjalan tanpa browser penuh. Playwright menyalakan server lokal dan menguji Chromium desktop/mobile. Axe memeriksa DOM akhir, sedangkan `next build` menangkap masalah server/client boundary.

## Keputusan penting

- Tidak ada `dangerouslySetInnerHTML`.
- Environment publik dan rahasia tidak dicampur.
- Error UI tidak mencetak exception.
- Auth, upload, payment, dan database checks ditunda karena fiturnya memang belum ada.

## Kesalahan yang sering terjadi

- Menganggap `npm audit` sebagai satu-satunya security review.
- Menyimpan secret dengan prefix `NEXT_PUBLIC_`.
- Menambahkan CORS wildcard walau frontend tidak membutuhkannya.
- Menguji mobile hanya dengan mengecilkan desktop secara manual.

## Latihan buat lo

Tambahkan header `X-Frame-Options: DENY` ke `next.config.ts` dan buat test kecil terhadap hasil `headers()`.

## Cara memverifikasi latihan

Jalankan lint, test, dan production build:

```bash
npm test
npm run lint
npm run build
```
