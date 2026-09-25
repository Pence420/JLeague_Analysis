# 14 — Memahami Recruitment Value Proxy

Recruitment Value Proxy (RVP) adalah alat screening. Ia mengurutkan pemain menggunakan bukti yang tersedia, tetapi tidak menyatakan harga transfer, kualitas absolut, atau kepastian sukses.

Implementasi canonical ada di `apps/api/app/scoring.py`. Frontend hanya boleh mengubah bobot lima komponen akhir melalui `weightedValueProxy()`; ia tidak boleh membuat formula role performance sendiri.

## 1. Kenapa percentile harus per posisi

Tugas kiper, bek, gelandang, dan penyerang berbeda. Save rate tidak masuk profil FW dan goals tidak masuk profil DF. Karena itu cohort selalu dibatasi ke posisi yang sama:

```text
GK dibandingkan dengan GK
DF dibandingkan dengan DF
MF dibandingkan dengan MF
FW dibandingkan dengan FW
```

Jika semua nilai pada satu metric sama, semua pemain mendapat percentile 50. Ini mencegah pembagian nol dan ranking palsu.

## 2. Mengubah count menjadi per 90

Count seperti assists perlu dinormalisasi terhadap menit:

```text
assists_per90 = assists × 90 / minutes
```

Contoh: 6 assists dalam 1.350 menit:

```text
6 × 90 / 1350 = 0.40 assists per 90
```

Rate yang sudah berbentuk persen tidak dibagi menit lagi.

## 3. Shrinkage untuk sampel kecil

Percentile mentah ditarik ke nilai netral 50:

```text
reliability = min(1, minutes / 1800)
adjusted = 50 + reliability × (raw − 50)
```

Pemain dengan raw percentile 90:

| Menit | Reliability | Adjusted percentile |
| ----: | ----------: | ------------------: |
|   450 |        0,25 |               60,00 |
|   900 |        0,50 |               70,00 |
| 1.800 |        1,00 |               90,00 |

Artinya discovery mode 450 menit tetap bisa menemukan kandidat, tetapi tidak memperlakukan hot streak pendek seperti satu musim penuh.

## 4. Bobot role performance

Ringkasan profil:

- FW menekankan non-penalty xG, goals, assists, chances, shot accuracy, dribble, dan duels.
- MF menekankan creation, passing di area lawan, progression, duels, interceptions, dan finishing delta.
- DF menekankan duels, aerials, interceptions, tackles, clearances/blocks, dan passing.
- GK menekankan save rate, penalty-area saves, saves/90, cross claims, clean sheets, dan distribution.

Metric yang unavailable boleh dilewati dan bobot sisanya dinormalisasi ulang hanya jika metric tersedia mewakili minimal 60% profil. Kalau coverage 55%, statusnya `not_scored`—bukan skor 0.

## 5. Lima komponen akhir

### Role performance

Weighted mean dari adjusted percentile pada profil posisi.

### Opportunity

Tanpa role metrics, peluang screening berasal dari pemakaian relatif dalam cohort posisi:

```text
base opportunity =
  100 − (0,70 × minutes percentile + 0,30 × appearances percentile)
```

Setelah role performance tersedia:

```text
opportunity = 0,60 × role performance + 0,40 × base opportunity
```

Komponen ini mencari bukti performa pada penggunaan lebih rendah. Ia tidak berarti klub ingin menjual pemain tersebut.

### Development

```text
0,60 × performance percentile dalam age band + 0,40 × age runway
```

Age band: `≤21`, `22–24`, `25–28`, dan `29+`. Sebelum role performance tersedia, UI hanya menampilkan age runway dan melabelinya sebagai `Age development`. Nilai ini adalah proxy waktu pengembangan, bukan bukti perkembangan atau ramalan karier.

### Availability

```text
0,70 × minute share + 0,30 × appearance share
```

Kedua share dibatasi maksimum 100 dan dibandingkan dengan jumlah pertandingan klub.

### Data confidence

Confidence menggabungkan kelengkapan base data, ukuran sampel, dan coverage role metrics:

```text
0,45 × base-data coverage
+ 0,35 × min(100, minutes / 1800 × 100)
+ 0,20 × role-profile coverage
```

Karena role-profile coverage masih nol pada snapshot `research_only`, confidence partial tidak boleh dibaca sebagai confidence untuk final RVP.

## 6. Formula final

```text
RVP =
  0,50 × role performance
  + 0,20 × opportunity
  + 0,15 × development
  + 0,10 × availability
  + 0,05 × confidence
```

Contoh ilustratif lintas posisi memakai kondisi cohort yang sama: seluruh metric role berada di percentile 50, pemain berusia 24 tahun, 1.800 menit dari maksimum 3.420, dan coverage 100%.

| Posisi |  Role | Opportunity | Development | Availability | Confidence |   RVP |
| ------ | ----: | ----------: | ----------: | -----------: | ---------: | ----: |
| GK     | 50,00 |       50,00 |       60,40 |        52,63 |     100,00 | 54,32 |
| DF     | 50,00 |       50,00 |       60,40 |        52,63 |     100,00 | 54,32 |
| MF     | 50,00 |       50,00 |       60,40 |        52,63 |     100,00 | 54,32 |
| FW     | 50,00 |       50,00 |       60,40 |        52,63 |     100,00 | 54,32 |

Angka sama di sini sengaja: contoh mengisolasi formula akhir. Pada data nyata, metric profile berbeda akan menghasilkan role performance yang berbeda.

## 7. Sorting dan reproducibility

Backend menyimpan angka belum dibulatkan untuk sorting. Tampilan dibulatkan dua desimal. Jika final score sama, urutannya:

1. confidence lebih tinggi;
2. menit lebih tinggi;
3. stable player-season ID secara alfabetis/numerik.

Dengan aturan ini, hasil tidak berubah acak setiap refresh.

## 8. Membaca status di UI

- `scored`: cukup metric dan lolos batas menit;
- `ineligible`: menit di bawah mode 450/900;
- `not_scored`: metric posisi yang valid kurang dari 60%; komponen base-data tetap dapat tampil, tetapi final RVP tetap kosong.

Saat repository masih `research_only`, mayoritas pemain asli menampilkan Opportunity, Age development, Availability, dan Data confidence, tetapi Role performance serta final RVP tetap kosong. Ini menjaga halaman tetap berguna tanpa mengubah data yang tidak tersedia menjadi angka palsu.

## 9. Jalankan test rumus

```bash
cd apps/api
.venv/bin/python -m pytest tests/test_scoring.py -v
```

Test mencakup empat posisi, zero minutes, negative goals-minus-xG, equal cohort, insufficient metrics, shrinkage 450/1.800 menit, dan deterministic ties.
