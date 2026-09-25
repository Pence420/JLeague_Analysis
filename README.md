# J-Scout

J-Scout adalah produk recruitment intelligence J1 dengan frontend Next.js, backend FastAPI, database relasional, dan pipeline data yang dapat diaudit. Produk ini menyatukan overview liga, profil tim, player explorer, Recruitment Value Proxy, comparison, methodology, dan visualisasi performa klub 2D.

> Snapshot berisi 20 klub dan 772 catatan player-club-season asli J1 2025 dari J.LEAGUE Data Site. Identitas pemain, penampilan, menit, dan gol adalah fakta resmi. Advanced J STATS masih berstatus `research_only`, sehingga Recruitment Value Proxy sengaja menampilkan `not_scored` sampai izin penggunaan tercatat. Skor J-Scout bukan prediksi, valuasi transfer, atau pengganti scouting profesional.

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
features/league-intelligence/     Types, Zod validation, analytics, snapshot adapter
data/jleague/2025.json            Immutable official-data snapshot
data/jleague/metric-catalog.json  Kontrak 23 advanced metric dan usage gate
scripts/import_jleague_2025.py    Repeatable official-source importer
scripts/jleague_stats.py          Parser offline + identity join yang fail-closed
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
- `POST /api/v1/recruitment/rank`
- `POST /api/v1/moneyball/rank` — compatibility satu rilis, mengirim header deprecation
- `GET /api/v1/methodology`
- `GET /api/v1/data-coverage`

## Jalur belajar

Mulai dari [01 app shell](docs/learning/01-app-shell-and-island-navigation.md), lanjut berurutan sampai:

- [07 — Multi-page dashboard](docs/learning/07-multi-page-dashboard.md)
- [08 — FastAPI contracts](docs/learning/08-fastapi-contracts.md)
- [09 — PostgreSQL dan migration](docs/learning/09-postgresql-and-migrations.md)
- [10 — Frontend API adapter](docs/learning/10-frontend-api-adapter.md)
- [11 — Import data resmi J1 2025](docs/learning/11-official-jleague-data-import.md)
- [12 — Layout dashboard dan information density](docs/learning/12-dashboard-layout-and-information-density.md)
- [13 — Pipeline official player stats](docs/learning/13-official-player-stats-pipeline.md)
- [14 — Recruitment Value Proxy](docs/learning/14-recruitment-value-proxy.md)

Referensi visual redesign tersedia di `docs/design/redesign/`. Keputusan sumber ada di `docs/product/jleague-player-statistics-source-register.md`; metadata metric boleh dipelajari sekarang, sedangkan bulk advanced values belum dipublish.
