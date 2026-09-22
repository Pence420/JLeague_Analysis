# 08 — FastAPI: Kontrak Sebelum UI

## Tujuan

Backend J-Scout bertugas menyimpan fakta, menerapkan guardrail, dan mengembalikan bentuk data yang stabil. UI tidak boleh menebak-nebak schema database.

## 1. Alur request

```text
HTTP request → Pydantic validation → SQLAlchemy query → response_model → JSON
```

File penting:

- `apps/api/app/main.py`: route dan dependency session;
- `apps/api/app/schemas.py`: bentuk request/response;
- `apps/api/app/models.py`: bentuk penyimpanan;
- `apps/api/app/seed.py`: sample data deterministik.

## 2. Validasi Moneyball

Empat weight harus berada pada 0–100 dan totalnya harus tepat 100. Validasi dilakukan server-side walaupun frontend juga menampilkan error. Client validation adalah UX; server validation adalah trust boundary.

```py
@model_validator(mode="after")
def weights_total_one_hundred(self):
    if sum_weights != 100:
        raise ValueError("weights must total 100")
    return self
```

Response ranking mengembalikan `components`, bukan hanya final score. Ini membuat hasil dapat diaudit.

## 3. Pagination dengan cursor

`GET /players` menerima `after_id` dan `limit`. Cursor lebih stabil daripada offset saat data bertambah di tengah sesi.

```text
/api/v1/players?position=CB&limit=20&after_id=40
```

## 4. Session per request

Dependency `get_db()` membuka session dan selalu menutupnya setelah request selesai. Engine memakai pool kecil, `pool_pre_ping`, dan recycle untuk koneksi PostgreSQL yang sehat.

## 5. Menjalankan test

```bash
cd apps/api
uv run pytest
```

Test menggunakan SQLite in-memory supaya cepat, tetapi kontrak route dan scoring tetap sama.

## Latihan

Tambahkan filter `max_age` pada endpoint players, validasi 15–45, lalu tulis satu test untuk nilai valid dan satu test untuk nilai 99.
