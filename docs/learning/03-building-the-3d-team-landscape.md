# 03 — Membangun 3D Team Landscape

## Masalah yang kita selesaikan

Tiga karakteristik gaya tim sulit dibaca dalam grafik 2D biasa. Landscape memetakan tiga metrik ke koordinat X, Y, dan Z tanpa berpura-pura memakai data spasial pertandingan.

## Mental model

Three.js hanyalah renderer. Makna tetap berasal dari fungsi analytics yang mengubah metrik ke `TeamLandscapePoint`. Scene menerima koordinat siap pakai dan tidak menghitung metodologi.

## Peta file

- `analytics.ts#buildTeamLandscape`: normalisasi dan tactical cluster.
- `team-landscape-3d.tsx`: kamera, cahaya, sphere, grid, dan orbit controls.
- `team-landscape-fallback.tsx`: tabel serta narasi ekuivalen.

## Aliran data dan event

Filter sumbu mengubah state pada `useLeagueDashboard`. View model dihitung ulang. Sphere dan tabel menerima array yang sama. Memilih sphere atau tombol tabel memanggil `onSelectTeam` yang sama.

## Keputusan penting

- Koordinat dinormalisasi ke rentang `-1..1`.
- Ukuran sphere hanya sedikit dipengaruhi coverage agar tidak menyesatkan.
- Warna cluster selalu ditemani label.
- Autoplay rotation dimatikan saat pengguna memilih reduced motion.

## Kesalahan yang sering terjadi

- Memakai 3D hanya sebagai dekorasi.
- Menghitung metrik di dalam render loop.
- Membuat kamera bisa tersesat terlalu jauh.
- Mengabaikan pengguna keyboard karena canvas tidak menyediakan struktur semantik.

## Latihan buat lo

Tambahkan preset sumbu bernama `Control profile` yang memilih possession control, defensive disruption, dan attacking output.

## Cara memverifikasi latihan

Pastikan ketiga dropdown berubah dan tabel menampilkan urutan kolom yang sama. Jalankan:

```bash
npm test -- components/charts/team-landscape.test.tsx
```
