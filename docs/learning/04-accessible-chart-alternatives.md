# 04 — Accessible Chart Alternatives

## Masalah yang kita selesaikan

Canvas tidak memberi screen reader struktur tabel dan bisa gagal jika WebGL tidak tersedia. Informasi yang penting tidak boleh terkunci di visual interaktif.

## Mental model

Fallback bukan screenshot atau versi “lebih jelek”. Ia adalah representasi lain dari model data yang sama: judul, definisi sumbu, nilai, cluster, coverage, serta selection action.

## Peta file

- `team-landscape-fallback.tsx`: semantic table dan summary.
- `team-landscape-3d.tsx`: deteksi WebGL serta reduced motion.
- `team-landscape.test.tsx`: fallback dan keyboard selection.

## Aliran data dan event

Canvas dan tabel membaca `points`, `axes`, dan `selectedTeamId` yang sama. Saat WebGL gagal, disclosure dibuka otomatis dan pesan menjelaskan bahwa data lengkap tetap tersedia.

## Keputusan penting

- Tabel selalu ada di DOM, tidak hanya dibuat setelah error.
- Scroll horizontal terjadi di region tabel, bukan pada seluruh halaman.
- Selection menggunakan button bernama team, bukan row click tanpa semantics.

## Kesalahan yang sering terjadi

- Alt text generik seperti “chart”.
- Menyembunyikan data tabel dengan `display:none` permanen.
- Memberi canvas interaksi hover tanpa jalur keyboard.

## Latihan buat lo

Tambahkan tombol `Select` eksplisit di kolom terakhir tabel dan pertahankan nama team sebagai teks biasa.

## Cara memverifikasi latihan

Gunakan Tab sampai tombol selection, tekan Enter, lalu pastikan summary menyebut team yang dipilih.
