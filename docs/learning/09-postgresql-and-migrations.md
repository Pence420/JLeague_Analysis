# 09 — PostgreSQL, Relasi, dan Migration

## Tujuan

Schema memisahkan identitas yang relatif stabil dari fakta per musim.

```text
competitions ─┬─ club_seasons ─ clubs
              └─ player_seasons ─┬─ players
                                 └─ clubs
```

## 1. Mengapa ada tabel season

Nama pemain tidak perlu disalin setiap musim, sedangkan minutes, role, dan score pasti berubah. Karena itu:

- `players` menyimpan identitas;
- `player_seasons` menyimpan fakta kompetisi-musim;
- constraint unik mencegah dua record untuk kombinasi pemain/klub/kompetisi/musim yang sama.

Klub sengaja dimiliki `player_seasons`, bukan `players`. Identitas pemain tetap satu,
tetapi pemain yang transfer dapat memiliki lebih dari satu catatan klub dalam satu musim.

## 2. Constraint adalah pertahanan data

Contoh yang dipakai:

- `minutes >= 0`;
- `coverage BETWEEN 0 AND 100`;
- foreign key dengan aturan delete yang eksplisit;
- unique key untuk player/competition/season.

Validasi aplikasi memberi pesan bagus, tetapi constraint database mencegah data rusak dari script atau service lain.

## 3. Index mengikuti query

Endpoint player sering memfilter `season`, `position`, lalu `minutes`, sehingga tersedia composite index dengan urutan yang sama. Semua foreign key juga diberi index agar join dan delete check tidak menjadi full scan.

## 4. Migration, bukan create-all untuk produksi

`create_all()` hanya membantu local test. Environment nyata harus memakai:

```bash
cd apps/api
uv run alembic upgrade head
```

Migration pertama ada di `apps/api/alembic/versions/20260922_0001_core.py`. File migration harus direview karena ia adalah sejarah database, bukan file sementara.

## 5. Primary key lintas PostgreSQL dan SQLite

Produksi memakai PostgreSQL, jadi primary key tetap `BIGINT IDENTITY`. SQLite hanya
memberikan auto-increment implisit ketika deklarasinya tepat `INTEGER PRIMARY KEY`;
`BIGINT PRIMARY KEY` tidak cukup. Migration memakai SQLAlchemy type variant agar satu
schema menghasilkan tipe yang tepat untuk masing-masing engine:

```python
def _bigint():
    return sa.BigInteger().with_variant(sa.Integer(), "sqlite")
```

Regression test menjalankan seluruh migration pada database SQLite kosong lalu mencoba
seed. Ini penting karena test yang hanya memakai `Base.metadata.create_all()` tidak akan
menangkap perbedaan antara model terbaru dan sejarah migration.

Untuk mode belajar tanpa Docker:

```bash
cd apps/api
DATABASE_URL=sqlite+pysqlite:///./jscout-dev.db uv run alembic upgrade head
DATABASE_URL=sqlite+pysqlite:///./jscout-dev.db uv run uvicorn app.main:app --reload --port 8000
```

## 6. Menyalakan PostgreSQL

```bash
docker compose up -d postgres
cd apps/api
uv run alembic upgrade head
```

Password di compose hanya untuk development lokal. Produksi wajib memakai secret manager, role migrator terpisah, TLS, backup, dan application role dengan hak minimum.

## Latihan

Buat migration kedua untuk tabel `shortlists` dan `shortlist_players`. Tentukan sendiri aturan delete ketika player dihapus, lalu jelaskan keputusan tersebut dalam komentar migration.
