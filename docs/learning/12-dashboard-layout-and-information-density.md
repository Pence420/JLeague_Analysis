# 12 — Merapikan kepadatan informasi dashboard

## Masalah yang diselesaikan

Header League sebelumnya memuat snapshot, filter minimum menit, status API, dan versi metodologi. Informasi tersebut mengulang data yang sudah tampil di `DataConfidence`, membuat bagian atas berat, sementara kolom di bawahnya masih menyisakan ruang kosong.

## Prinsip yang dipakai

Dashboard tidak perlu mengisi setiap ruang dengan dekorasi. Namun, jika satu kolom jauh lebih pendek daripada kolom di sebelahnya, ruang itu bisa dipakai untuk konteks yang membantu pembacaan data utama.

Perubahan ini melakukan dua hal:

1. `ContextHeader` hanya menjelaskan halaman. Detail provenance tetap tersedia di `DataConfidence`.
2. `LeagueDistribution` merangkum bentuk klasemen ke empat band: title race, upper half, mid-table, dan bottom three.

## Aliran data

`app/page.tsx` mengirim `viewModel.leagueState` ke `LeagueDistribution`. Komponen kemudian:

- memfilter klub berdasarkan rentang peringkat;
- menghitung jumlah klub dalam setiap band;
- mengambil rentang poin tertinggi dan terendah;
- menampilkan hasil tanpa membuat metrik baru atau data fiktif.

Semua angka berasal dari final table yang sama dengan tabel klasemen dan chart utama.

## Peta file

- `components/dashboard/context-header.tsx`: judul dan deskripsi halaman.
- `components/dashboard/data-confidence.tsx`: snapshot, coverage, eligibility, dan metodologi.
- `components/dashboard/league-distribution.tsx`: ringkasan empat band klasemen.
- `app/page.tsx`: menyusun `DataConfidence` dan `LeagueDistribution` sebagai satu kolom vertikal.

## Hal yang perlu dihindari

- Mengulang informasi yang sama di beberapa kartu.
- Mengisi ruang kosong dengan angka yang tidak membantu keputusan.
- Memaksakan tinggi kartu dengan nilai pixel tetap.
- Mengubah band klasemen tanpa menjelaskan batas peringkatnya.

## Latihan

Tambahkan nama klub dengan poin tertinggi pada setiap band. Gunakan data `clubs` yang sudah tersedia di dalam `LeagueDistribution`; jangan mencari data melalui request baru.

## Verifikasi

```bash
npm test -- --run components/dashboard/league-overview.test.tsx
npm run e2e
```

Pastikan halaman tidak overflow secara horizontal pada viewport mobile.
