# J-Scout

J-Scout adalah dashboard recruitment intelligence J1 dengan frontend Next.js dan backend FastAPI. Produk ini menyatukan overview liga, profil tim, player explorer, transparent Moneyball ranking, comparison, methodology, dan visualisasi team-style 3D.

> Seluruh klub, pemain, dan statistik saat ini adalah **synthetic sample data**. Hasilnya adalah sinyal decision-support, bukan prediksi, jaminan, atau pengganti scouting profesional.

## Menjalankan full stack

Kebutuhan: Node.js 20+, npm 10+, Python 3.12+, `uv`, dan Docker Desktop untuk PostgreSQL.

```bash
npm install
cp .env.example .env.local
docker compose up -d postgres
cd apps/api && uv sync && uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

Di terminal kedua:

```bash
npm run dev
```

- Dashboard: `http://127.0.0.1:3000`
- API docs: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/api/v1/health`

Jika Docker belum aktif, backend dapat dipelajari dengan SQLite:

```bash
cd apps/api
DATABASE_URL=sqlite+pysqlite:///./jscout-dev.db uv run uvicorn app.main:app --port 8000
```

Frontend sengaja memiliki local fallback. Kalau API belum hidup, semua page tetap dapat dipakai dengan fixture tervalidasi dan label sumber akan berubah menjadi `local fallback`.

## Quality checks

```bash
npm test
npm run lint
npm run build
npm run e2e
npm run api:test
```

## Struktur penting

```text
app/                              Next.js routes
components/                       App shell, dashboard modules, charts
features/api/                     Adapter kontrak FastAPI → domain frontend
features/league-intelligence/     Types, Zod validation, analytics, fallback data
apps/api/app/                     FastAPI, SQLAlchemy models, seed, endpoints
apps/api/alembic/                 PostgreSQL migrations
apps/api/tests/                   Backend contract and scoring tests
docs/design/redesign/             Referensi visual per page
docs/learning/                    Tutorial implementasi berbahasa Indonesia
e2e/                              Browser, responsive, interaction, accessibility tests
```

## API utama

- `GET /api/v1/league/2025/overview`
- `GET /api/v1/teams`
- `GET /api/v1/players`
- `GET /api/v1/players/compare?ids=1,2`
- `POST /api/v1/moneyball/rank`
- `GET /api/v1/methodology`
- `GET /api/v1/data-coverage`

## Jalur belajar

Mulai dari [01 app shell](docs/learning/01-app-shell-and-island-navigation.md), lanjut berurutan sampai:

- [07 — Multi-page dashboard](docs/learning/07-multi-page-dashboard.md)
- [08 — FastAPI contracts](docs/learning/08-fastapi-contracts.md)
- [09 — PostgreSQL dan migration](docs/learning/09-postgresql-and-migrations.md)
- [10 — Frontend API adapter](docs/learning/10-frontend-api-adapter.md)

Referensi visual redesign tersedia di `docs/design/redesign/`. Implementasi sengaja memakai identitas fiktif dan memperbaiki artefak gambar yang tidak layak dijadikan data.
