# 13 — Membangun pipeline official player stats yang aman

Bab ini menjelaskan aliran data dari definisi metric sampai API. Fokusnya bukan sekadar “bisa scrape”, tetapi bagaimana menjaga arti data, identitas pemain, hak penggunaan, dan audit trail.

## 1. Mulai dari kontrak, bukan HTML

File `data/jleague/metric-catalog.json` adalah kamus bersama. Setiap entry menentukan:

- `key`: nama stabil yang dipakai database, backend, dan frontend;
- `unit`: count, percent, per-90, atau expected goals;
- `valueKind`: bentuk nilai mentah atau derived;
- `positions`: posisi yang memakai metric itu;
- `sourcePath`: halaman resmi tempat nilai berasal;
- `usageStatus`: apakah nilainya baru boleh diteliti atau sudah boleh dipublish.

Kenapa katalog ini penting? Tanpa kontrak, satu layer bisa menganggap `87.4` sebagai rasio `0.874`, layer lain menganggapnya persen, dan hasil akhirnya tetap terlihat masuk akal walau salah.

Test kontraknya ada di `scripts/tests/test_metric_catalog.py`. Test memaksa key unik, posisi tidak kosong, direction valid, dan status setiap metric sama dengan status repository.

## 2. Usage gate harus fail closed

`docs/product/jleague-player-statistics-source-register.md` mencatat keputusan penggunaan sumber. Status sekarang adalah `research_only` karena halaman publik J.League membatasi penyalinan atau publikasi ulang tanpa izin.

Importer memiliki flag eksplisit:

```bash
python scripts/import_jleague_2025.py \
  --include-official-stats \
  --audit-output /private/tmp/jleague-audit.json
```

Namun `require_official_stats_approval()` membaca katalog sebelum melakukan pekerjaan advanced-stat. Selama status bukan `approved`, fungsi melempar `PermissionError`. Ini disebut fail closed: keadaan ambigu menghasilkan penolakan, bukan izin diam-diam.

Tanpa flag advanced stats, importer standings/roster lama tetap bekerja dan menulis audit dengan `officialStatsAction: "skipped"`.

## 3. Parser tidak boleh menyamakan kosong dengan nol

`scripts/jleague_stats.py` punya dua tipe utama:

```python
MetricDefinition(key, unit, value_kind, source_url)
OfficialMetricRow(player_id, player_name_ja, club_name_ja, rank, value)
```

`parse_metric_page()` memvalidasi tiga penanda sebelum menerima halaman:

1. metric marker sesuai kontrak;
2. label waktu pembaruan ada;
3. minimal satu result row ada.

Normalisasi angka menangani koma, `%`, full-width `％`, unit, dan Unicode whitespace. Nilai `0%` menghasilkan `0.0` dengan status `listed`.

Sebaliknya, pemain yang tidak muncul pada leaderboard top-200 baru diberi nilai berikut pada tahap join:

```json
{
  "value": null,
  "listingStatus": "not_listed",
  "sourceRank": null
}
```

Perbedaannya kritis:

- `listed + 0` berarti sumber resmi menyatakan nol;
- `not_listed + null` berarti kita tidak tahu nilainya dari halaman tersebut.

## 4. Identity join: ID lebih kuat daripada nama

`join_metric_rows()` memakai urutan keputusan:

1. official player ID + klub yang sama;
2. bila official ID memang tidak tersedia, nama Jepang ternormalisasi + klub;
3. fallback nama saja hanya bila hasilnya tepat satu pemain.

Jika dua pemain punya nama sama, row masuk daftar `ambiguous` dan tidak ditempel ke siapa pun. Kalau official ID cocok tetapi klub tidak cocok, row masuk `unmatched`; kode tidak boleh fallback ke klub lain.

Transfer juga ditangani eksplisit. Satu `officialPlayerId` dapat mempunyai dua record club-season:

```text
Player 123
├── 2025 · Kashima
└── 2025 · Kashiwa
```

Dengan model ini, identitas manusia tidak digandakan, tetapi statistik sebelum dan sesudah transfer tetap bisa dipisah.

## 5. Normalisasi database

Migration `20260924_0003_player_metrics_and_scores.py` melakukan tiga hal:

- memindahkan `club_id` dari `players` ke `player_seasons`;
- menambah `player_metric_values` untuk fakta resmi;
- menambah `player_score_snapshots` untuk hasil formula versioned.

Pemisahan tabel mencegah fakta resmi tercampur dengan kesimpulan J-Scout.

Constraint penting:

```text
UNIQUE (player_season_id, metric_key)
listing_status ∈ listed | not_listed | unavailable
listed     → value wajib numeric
not_listed → value wajib null
```

Score disimpan bersama `methodology_version`. Saat formula berubah, row lama tidak perlu ditimpa; ranking lama masih dapat diaudit.

## 6. Seed yang idempotent

`seed_database(session, snapshot)` melakukan upsert berdasarkan natural key:

- competition: `code`;
- club: `slug`;
- player: `officialPlayerId`;
- season: player + club + competition + season;
- metric: player-season + metric key;
- score: player-season + methodology version.

Menjalankan seed dua kali harus menghasilkan jumlah row yang sama. Test-nya ada di `apps/api/tests/test_persistence.py`.

## 7. Kontrak API menjaga provenance

`GET /api/v1/players` memisahkan dua namespace:

```json
{
  "official_metrics": {
    "assists": {
      "value": null,
      "listing_status": "not_listed",
      "source_url": "..."
    }
  },
  "derived_scores": {
    "status": "not_scored",
    "methodology_version": "jleague-official-2025.3"
  }
}
```

Frontend adapter hanya mengubah snake_case menjadi camelCase. Ia tidak menghitung ulang percentile dan tidak mengubah null menjadi nol.

## 8. Cara belajar lewat test

Jalankan dari root:

```bash
apps/api/.venv/bin/python -m pytest scripts/tests -v
cd apps/api && .venv/bin/python -m pytest tests/test_persistence.py -v
npm test -- --run features/api/client.test.ts
```

Baca kegagalan test sebagai dokumentasi kontrak. Ubah fixture kecil terlebih dahulu; jangan memakai bulk official data untuk eksperimen selama source status masih `research_only`.
