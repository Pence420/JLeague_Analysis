# 03 — Membangun Stepped Performance Chart

## Masalah yang kita selesaikan

Kita ingin menampilkan 20 klub sekaligus dengan bentuk bertingkat yang mudah dipindai seperti funnel. Tinggi bar bisa diganti antara points, goals scored, dan goal difference.

## Mental model

Komponen chart hanya bertugas mengurutkan dan menggambar data. Makna tetap berasal dari fungsi analytics yang mengubah metrik ke `TeamLandscapePoint`; chart tidak menghitung metodologi baru.

## Peta file

- `analytics.ts#buildTeamLandscape`: fakta final table dan kelompok posisi.
- `team-performance-chart.tsx`: sorting, normalisasi tinggi, stepped bars, dan interaksi.
- `team-landscape-fallback.tsx`: tabel serta narasi ekuivalen.

## Aliran data dan event

Filter measure mengubah state pada `useLeagueDashboard`. View model dihitung ulang. Chart dan tabel menerima array yang sama. Memilih bar atau tombol tabel memanggil `onSelectTeam` yang sama.

## Keputusan penting

- Seluruh 20 klub diurutkan dari nilai tertinggi agar siluet chart bertingkat.
- Tinggi dinormalisasi hanya untuk rendering; label tetap menunjukkan angka resmi.
- Arsiran ringan menjaga chart tetap terbaca tanpa memakai banyak warna.
- Hover, focus, dan click memakai detail yang sama supaya mouse dan keyboard setara.
- Area chart bisa digeser horizontal pada layar sempit agar label tidak bertumpuk.

## Kesalahan yang sering terjadi

- Mengurutkan label tetapi lupa mengurutkan bar dengan urutan yang sama.
- Memakai tinggi mentah sehingga nilai negatif tidak terlihat.
- Menyembunyikan angka asli setelah normalisasi visual.
- Membuat chart hanya bereaksi terhadap hover dan tidak bisa difokuskan keyboard.

## Latihan buat lo

Tambahkan opsi measure `Goals against`, lalu balik urutannya karena nilai lebih rendah lebih baik.

## Cara memverifikasi latihan

Pastikan dropdown dan tabel memakai angka yang sama. Jalankan:

```bash
npm test -- components/charts/team-landscape.test.tsx
```
