# 07 — Membentuk Dashboard Multi-page yang Konsisten

## Tujuan

Bagian ini menjelaskan bagaimana satu dashboard berkembang menjadi enam page tanpa setiap page terasa seperti produk berbeda.

## 1. Pisahkan shell dari isi page

`IslandNav` menangani identitas produk dan perpindahan route. `PageFrame` menangani lebar konten, jarak dari navbar, judul, dan deskripsi. Page hanya bertanggung jawab pada workflow-nya.

```tsx
<PageFrame title="Teams" description="Compare club performance and style.">
  <TeamTable />
</PageFrame>
```

Keuntungannya: perubahan padding atau lebar maksimum cukup dilakukan sekali di `components/app-shell/page-frame.tsx`.

## 2. Gunakan satu bahasa visual

Token di `app/globals.css` membatasi pilihan:

- canvas warm white;
- card putih dengan border tipis;
- charcoal untuk aksi utama;
- burgundy hanya untuk selection atau highlight analitis;
- radius 8–12px dan hampir tanpa shadow.

Pembatasan ini penting. Desain terasa matang bukan karena banyak efek, tetapi karena keputusan yang konsisten.

## 3. Pilih pola sesuai pekerjaan user

- Teams: table → pilih row → baca profile rail.
- Players: filter → shortlist → kirim dua kandidat ke Compare.
- Moneyball: atur weight → lihat ranking → audit decomposition.
- Compare: pilih dua pemain → shared metrics → baca evidence summary.
- Methodology: daftar isi → formula → coverage dan limitation.

Jangan memaksa semua data menjadi card. Data yang perlu dibandingkan secara vertikal hampir selalu lebih jelas dalam table.

## 4. Route aktif berasal dari URL

`usePathname()` menentukan destination aktif. Dengan begitu nav tidak bergantung pada state manual yang bisa salah setelah browser back/forward.

## Latihan

Tambahkan page `/shortlists` memakai `PageFrame`. Buat empty state yang menjelaskan cara menambahkan pemain, bukan sekadar tulisan “No data”.
