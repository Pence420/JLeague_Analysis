# 01 — App Shell dan Island Navigation

## Masalah yang kita selesaikan

Dashboard analitik butuh navigasi yang selalu mudah ditemukan tanpa memakan banyak tinggi layar. Desktop memakai island navigation di tengah atas; mobile memindahkannya ke bawah agar mudah dijangkau ibu jari.

## Mental model

Anggap app shell sebagai bingkai yang stabil. Isi halaman boleh berubah, tetapi identitas, navigasi, fokus keyboard, metadata, error state, dan responsive behavior harus konsisten.

## Peta file

- `app/layout.tsx`: metadata dan root document.
- `app/globals.css`: design tokens dan aturan global.
- `components/app-shell/island-nav.tsx`: dua presentasi dari destination list yang sama.
- `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx`: state global.

## Aliran data dan event

`IslandNav` menerima `activeHref`. Destination list menghasilkan link desktop serta mobile. Tombol `More` hanya mengatur state presentasi lokal; perpindahan halaman tetap memakai link semantik.

## Keputusan penting

- Active state memakai `aria-current="page"` dan underline merah.
- Mobile navigation mempunyai touch target minimal 44px.
- Error page tidak menampilkan pesan exception mentah.
- Island tidak membungkus seluruh halaman; ia tetap elemen fokus yang terpisah.

## Kesalahan yang sering terjadi

- Membuat desktop dan mobile memiliki destination list terpisah sampai isinya menyimpang.
- Mengandalkan warna saja untuk active state.
- Lupa memberi padding bawah pada halaman sehingga fixed navigation menutupi konten.

## Latihan buat lo

Tambahkan destination `Reports` ke daftar navigasi dan tampilkan di menu `More` mobile, bukan sebagai item utama.

## Cara memverifikasi latihan

Tambahkan assertion ke `components/app-shell/island-nav.test.tsx`, lalu jalankan:

```bash
npm test -- components/app-shell/island-nav.test.tsx
```
