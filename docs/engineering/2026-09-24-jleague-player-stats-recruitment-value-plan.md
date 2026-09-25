# J.League Player Statistics and Recruitment Value Implementation Plan

> Execution checklist for the player-statistics and Recruitment Value Proxy work. The repository owner performs every Git commit; implementation work must not commit or push.

**Goal:** Enrich J1 2025 player records with permitted official J.LEAGUE statistics and replace the current Moneyball formula with a position-aware, sample-adjusted Recruitment Value Proxy.

**Architecture:** A manual importer converts reviewed official pages into an immutable snapshot with explicit source/listing metadata. PostgreSQL stores official metric values separately from versioned derived score snapshots; FastAPI is the canonical scoring boundary, while Next.js only displays returned components and applies user-selected component weights.

**Tech Stack:** Python 3.12, urllib/HTML parsing, FastAPI, Pydantic, SQLAlchemy, Alembic, PostgreSQL/SQLite test fallback, Next.js 16, React 19, TypeScript, Zod, Vitest, Pytest, Playwright.

**Spec:** `docs/product/jleague-player-stats-and-recruitment-value-design.md`

## Global Constraints

- Do not commit, push, or rewrite Git history; the repository owner commits after each review checkpoint.
- Do not scrape J.LEAGUE at application runtime.
- Default source status is `research_only` until written terms or permission allow storing and republishing extracted values.
- Do not commit a bulk extracted snapshot while source status is `research_only`.
- Official facts and J-Scout-derived scores must use separate fields, tables, and UI labels.
- A player missing from a top-200 leaderboard is `not_listed`, never zero.
- Scores compare players only within `GK`, `DF`, `MF`, or `FW` cohorts.
- Default eligibility is 900 minutes; discovery mode is 450 minutes and must show reduced confidence.
- The user-facing score is “Recruitment Value Proxy”, never a transfer valuation.
- New product documents belong in `docs/product/`, engineering plans in `docs/engineering/`, and tutorials in `docs/learning/`.

## Review Focus

1. A valid zero and an absent leaderboard entry must remain distinguishable (`listed: 0` versus `not_listed: null`); Task 2 pins this in parser tests.
2. One person appearing for two clubs after a transfer must keep one official identity but two club-season records; Tasks 2 and 3 pin this in importer and database tests.
3. A player with too few available role metrics must return `not_scored`, not a misleading low score; Task 4 pins this in scoring tests.
4. Zero minutes, equal metric values, negative goals-minus-xG, and percentage strings must not produce division errors or `NaN`; Tasks 2 and 4 pin these cases.
5. Equal final scores must sort deterministically by confidence, minutes, then stable player ID; Tasks 4 and 5 pin the ordering.

---

## File structure

```text
data/jleague/metric-catalog.json                 Shared metric definitions
data/jleague/2025.json                           Existing immutable snapshot; enrich only after usage approval
scripts/jleague_stats.py                         Official-stat parser and identity join
scripts/import_jleague_2025.py                   Snapshot orchestration
scripts/tests/fixtures/jleague/                   Small reviewed HTML fixtures
scripts/tests/test_jleague_stats.py               Parser and identity tests
apps/api/app/models.py                            Player identity, club-season, metric, and score models
apps/api/app/scoring.py                           Canonical normalization and scoring engine
apps/api/app/schemas.py                           Public API contracts
apps/api/app/main.py                              Player and ranking endpoints
apps/api/app/seed.py                              Snapshot-to-database loading
apps/api/alembic/versions/20260924_0003_*.py      Additive database migration
features/league-intelligence/types.ts             Frontend domain contracts
features/league-intelligence/fixture-schema.ts    Snapshot validation
features/api/client.ts                            API adapter
app/moneyball/page.tsx                            Recruitment Value Proxy workbench
app/players/page.tsx                              Official player metrics
components/compare/compare-workbench.tsx          Position-aware comparison
app/methodology/page.tsx                          Public methodology
docs/product/jleague-player-statistics-source-register.md
docs/learning/13-official-player-stats-pipeline.md
docs/learning/14-recruitment-value-proxy.md
```

### Task 1: Lock the source decision and metric contract

**Files:**
- Create: `docs/product/jleague-player-statistics-source-register.md`
- Create: `data/jleague/metric-catalog.json`
- Create: `scripts/tests/test_metric_catalog.py`

**Interfaces:**
- Produces: metric objects shaped as `{key, label, group, unit, direction, valueKind, positions, sourcePath, usageStatus}`.
- Produces: repository-wide usage status `research_only` until permission is recorded.

- [ ] **Step 1: Write the failing catalog validation test**

```python
import json
from pathlib import Path


def test_metric_catalog_has_unique_keys_and_explicit_usage_status():
    catalog = json.loads(Path("data/jleague/metric-catalog.json").read_text())
    keys = [item["key"] for item in catalog["metrics"]]
    assert len(keys) == len(set(keys))
    assert catalog["usageStatus"] in {"research_only", "approved"}
    assert all(item["direction"] in {"higher", "lower", "neutral"} for item in catalog["metrics"])
    assert all(item["positions"] for item in catalog["metrics"])
```

- [ ] **Step 2: Run the test and verify the contract does not exist**

Run: `UV_CACHE_DIR=/private/tmp/jscout-uv-cache uv run pytest scripts/tests/test_metric_catalog.py -v`

Expected: FAIL because `data/jleague/metric-catalog.json` does not exist.

- [ ] **Step 3: Add the first-release catalog**

Include exactly the metrics required by the approved position profiles: `non_penalty_xg`, `goals`, `assists`, `chances_created`, `shots_on_target_rate`, `dribble_success`, `duels_won_per90`, `opposition_half_pass_completion`, `through_passes`, `interceptions`, `goals_minus_xg`, `aerial_duel_win_rate`, `tackles`, `tackle_success`, `clearances`, `blocks`, `pass_completion`, `save_rate`, `penalty_area_save_rate`, `saves_per90`, `cross_claim_rate`, `clean_sheet_rate`, and `distribution_completion`.

Every entry must use `usageStatus: "research_only"` initially and include its exact official source path.

- [ ] **Step 4: Write the source register**

Record the source owner, data provider, public URL, retrieval method, top-200 limitation, prohibition notice, intended portfolio use, and current decision `research_only`. State explicitly that only minimal parser fixtures may be committed until status changes to `approved`.

- [ ] **Step 5: Run the catalog test**

Run: `UV_CACHE_DIR=/private/tmp/jscout-uv-cache uv run pytest scripts/tests/test_metric_catalog.py -v`

Expected: PASS.

- [ ] **Step 6: Repository-owner review checkpoint**

Present only the source register and catalog diff. Do not start bulk ingestion until the owner confirms the usage decision. Do not commit.

### Task 2: Parse official metric pages without confusing missing and zero

**Files:**
- Create: `scripts/jleague_stats.py`
- Create: `scripts/tests/test_jleague_stats.py`
- Create: `scripts/tests/fixtures/jleague/assists.html`
- Create: `scripts/tests/fixtures/jleague/pass-completion.html`
- Create: `scripts/tests/fixtures/jleague/goalkeeper-save-rate.html`
- Modify: `scripts/import_jleague_2025.py`

**Interfaces:**
- Produces: `parse_metric_page(html: str, definition: MetricDefinition) -> list[OfficialMetricRow]`.
- Produces: `join_metric_rows(players: list[dict], rows: list[OfficialMetricRow], metric_key: str) -> MetricJoinResult`.
- `MetricJoinResult` contains `values`, `matched`, `ambiguous`, and `unmatched`.

- [ ] **Step 1: Write parser tests for count, percentage, zero, and absent rows**

```python
def test_parse_percentage_and_zero_as_listed_values():
    rows = parse_metric_page(PASS_FIXTURE, definition("pass_completion"))
    assert rows[0].value == 87.4
    assert rows[0].listing_status == "listed"
    assert rows[-1].value == 0.0
    assert rows[-1].listing_status == "listed"


def test_join_leaves_absent_player_not_listed():
    result = join_metric_rows(PLAYERS, parse_metric_page(ASSIST_FIXTURE, definition("assists")), "assists")
    assert result.values["player-not-on-page"]["value"] is None
    assert result.values["player-not-on-page"]["listingStatus"] == "not_listed"
```

- [ ] **Step 2: Write identity tests for official ID, fallback name, transfer, and ambiguity**

```python
def test_transfer_keeps_two_club_seasons_for_one_official_identity():
    result = join_metric_rows(TRANSFER_RECORDS, TRANSFER_METRIC_ROWS, "assists")
    assert result.values["123-kashima"]["value"] == 2
    assert result.values["123-kashiwa"]["value"] == 1


def test_ambiguous_fallback_is_not_attached():
    result = join_metric_rows(DUPLICATE_NAMES, NAME_ONLY_ROWS, "tackles")
    assert result.ambiguous == ["同名 選手"]
    assert all(value["value"] is None for value in result.values.values())
```

- [ ] **Step 3: Run the focused tests**

Run: `UV_CACHE_DIR=/private/tmp/jscout-uv-cache uv run pytest scripts/tests/test_jleague_stats.py -v`

Expected: FAIL because parser functions do not exist.

- [ ] **Step 4: Implement typed parser records**

```python
@dataclass(frozen=True)
class MetricDefinition:
    key: str
    unit: str
    value_kind: Literal["count", "percentage", "decimal"]
    source_url: str


@dataclass(frozen=True)
class OfficialMetricRow:
    player_id: str | None
    player_name_ja: str
    club_name_ja: str
    rank: int
    value: float
    listing_status: Literal["listed"] = "listed"
```

Parsing must reject a page without its expected heading, updated-at label, and at least one result row. Convert commas, `%`, `km`, and Unicode whitespace explicitly; never infer absence as zero.

- [ ] **Step 5: Extend snapshot orchestration behind the usage gate**

Add `--include-official-stats` and require catalog `usageStatus == "approved"` before writing extracted values into `data/jleague/2025.json`. Without that flag, preserve current snapshot behavior. Always write an audit JSON to a temporary output path supplied by `--audit-output`.

- [ ] **Step 6: Run parser and existing importer tests**

Run: `UV_CACHE_DIR=/private/tmp/jscout-uv-cache uv run pytest scripts/tests -v`

Expected: PASS, including zero-versus-absent and transfer cases.

- [ ] **Step 7: Repository-owner review checkpoint**

Show parser fixtures, audit format, and gate behavior. Do not commit or fetch the full metric catalogue during review.

### Task 3: Add official metric and versioned score storage

**Files:**
- Modify: `apps/api/app/models.py`
- Modify: `apps/api/app/seed.py`
- Create: `apps/api/alembic/versions/20260924_0003_player_metrics_and_scores.py`
- Modify: `apps/api/tests/test_api.py`

**Interfaces:**
- Produces: one `Player` identity per `officialPlayerId`; club membership moves to `PlayerSeason.club_id`.
- Produces: `PlayerMetricValue(player_season_id, metric_key, value, unit, listing_status, source_rank, source_url, retrieved_at)`.
- Produces: `PlayerScoreSnapshot(player_season_id, methodology_version, status, role_performance, opportunity, development, availability, confidence, value_proxy, calculated_at)`.

- [ ] **Step 1: Write database persistence tests**

```python
def test_seed_preserves_listed_zero_and_not_listed_null(session, official_snapshot):
    seed_database(session, official_snapshot)
    zero = session.scalar(select(PlayerMetricValue).where(PlayerMetricValue.metric_key == "assists", PlayerMetricValue.listing_status == "listed"))
    missing = session.scalar(select(PlayerMetricValue).where(PlayerMetricValue.metric_key == "tackles", PlayerMetricValue.listing_status == "not_listed"))
    assert zero.value == Decimal("0")
    assert missing.value is None


def test_transfer_uses_one_player_and_two_club_seasons(session, transfer_snapshot):
    seed_database(session, transfer_snapshot)
    player = session.scalar(select(Player).where(Player.source_player_id == "123"))
    assert len(player.seasons) == 2
    assert {season.club.slug for season in player.seasons} == {"kashima", "kashiwa"}
```

- [ ] **Step 2: Run the test and verify missing models**

Run: `cd apps/api && UV_CACHE_DIR=/private/tmp/jscout-uv-cache uv run pytest tests/test_api.py -v`

Expected: FAIL because `PlayerMetricValue` and `PlayerScoreSnapshot` do not exist.

- [ ] **Step 3: Normalize player identity and club-season membership**

Move `club_id` from `Player` to `PlayerSeason`. Change `Player.source_player_id` to store the snapshot's `officialPlayerId`, not the club-scoped record `id`. Replace `uq_player_season_scope` with a unique constraint on `(player_id, club_id, competition_id, season)` so a transferred player can retain two official club records.

For existing rows, the migration joins each player to its current club and verifies that `source_player_id` ends with `-<club.slug>`. It removes that verified suffix to recover the official identity, chooses one canonical `Player` row, points all associated seasons to it, copies the previous player club into `PlayerSeason.club_id`, then removes duplicate player rows. Abort if a suffix does not match; never guess by English name or depend on an external snapshot file during migration.

- [ ] **Step 4: Add metric and score models with constraints**

Use `Numeric(12, 4)` for values, a unique constraint on `(player_season_id, metric_key)`, a check constraint for `listing_status IN ('listed', 'not_listed', 'unavailable')`, and indexes on `player_season_id`, `metric_key`, and `(methodology_version, value_proxy)`. Score components are nullable when `status == 'not_scored'`.

- [ ] **Step 5: Write the migration**

Create both metric tables and perform the explicit player-identity data migration above. The downgrade must recreate club-scoped Player rows before restoring `Player.club_id`; document that downgrade as data-preserving but identity-denormalizing.

- [ ] **Step 6: Extend seeding idempotently**

Upsert `Player` by `officialPlayerId`, `PlayerSeason` by `(player, club, competition, season)`, and metric values by `(player_season_id, metric_key)`. A second seed run must leave row counts unchanged and update changed source metadata rather than duplicating rows.

- [ ] **Step 7: Run migration and persistence tests against SQLite fallback**

Run: `cd apps/api && DATABASE_URL=sqlite+pysqlite:///./jscout-plan-test.db UV_CACHE_DIR=/private/tmp/jscout-uv-cache uv run alembic upgrade head && UV_CACHE_DIR=/private/tmp/jscout-uv-cache uv run pytest -v`

Expected: migration succeeds and all API tests pass.

- [ ] **Step 8: Repository-owner review checkpoint**

Present migration, constraints, and idempotency evidence. Do not commit.

### Task 4: Implement the canonical position-aware scoring engine

**Files:**
- Create: `apps/api/app/scoring.py`
- Create: `apps/api/tests/test_scoring.py`
- Modify: `apps/api/app/seed.py`

**Interfaces:**
- Produces: `calculate_score(player: PlayerScoringInput, cohort: list[PlayerScoringInput], minimum_minutes: int) -> ScoreResult`.
- `ScoreResult.status` is `scored`, `ineligible`, or `not_scored`.
- Produces methodology version `jleague-official-2025.2`.

- [ ] **Step 1: Write tests for per-90, percentile direction, and shrinkage**

```python
def test_small_sample_percentile_is_shrunk_toward_fifty():
    assert adjusted_percentile(raw_percentile=90, minutes=450) == 60
    assert adjusted_percentile(raw_percentile=90, minutes=1800) == 90


def test_zero_minutes_is_ineligible_without_division():
    result = calculate_score(player(minutes=0), cohort=[], minimum_minutes=450)
    assert result.status == "ineligible"
    assert result.value_proxy is None
```

- [ ] **Step 2: Write one worked scoring test per position**

Each fixture must provide the exact role metrics from the spec and assert component values to two decimals. Include a goalkeeper test proving clean sheets contribute only 10%, and a defender test proving goals do not enter the DF profile.

- [ ] **Step 3: Write missing coverage and deterministic tie tests**

```python
def test_too_few_role_metrics_returns_not_scored():
    result = calculate_score(player_with_available_metrics(2), FULL_DF_COHORT, 900)
    assert result.status == "not_scored"
    assert result.reason == "insufficient_role_metrics"


def test_rank_ties_use_confidence_minutes_then_id():
    ranked = rank_results([score("b", 70, 90, 2000), score("a", 70, 90, 2000)])
    assert [item.player_id for item in ranked] == ["a", "b"]
```

- [ ] **Step 4: Run scoring tests and verify they fail**

Run: `cd apps/api && UV_CACHE_DIR=/private/tmp/jscout-uv-cache uv run pytest tests/test_scoring.py -v`

Expected: FAIL because scoring functions do not exist.

- [ ] **Step 5: Implement metric normalization and role profiles**

Implement percentile rank with stable handling when all values are equal: every player receives 50. For metrics whose catalog direction is `lower`, invert the percentile. Redistribute missing metric weights only when at least 60% of the profile weight is available; otherwise return `not_scored`.

- [ ] **Step 6: Implement the five components and final proxy**

```python
value_proxy = (
    role_performance * 0.50
    + opportunity * 0.20
    + development * 0.15
    + availability * 0.10
    + confidence * 0.05
)
```

Keep unrounded floats for sorting; round to two decimals only in serialized output. Negative raw metrics remain valid inputs.

- [ ] **Step 7: Persist score snapshots during seed/refresh**

Recalculate `jleague-official-2025.2` scores after metric upsert. Preserve older methodology rows for auditability; upsert only the same player-season and methodology version.

- [ ] **Step 8: Run scoring and API tests**

Run: `cd apps/api && UV_CACHE_DIR=/private/tmp/jscout-uv-cache uv run pytest -v`

Expected: PASS for all four positions, missing metrics, sample shrinkage, zero minutes, equal cohorts, negative metrics, and ties.

- [ ] **Step 9: Repository-owner review checkpoint**

Present worked examples and compare new rankings against the old age/minutes formula. Do not commit.

### Task 5: Publish explicit official and derived API contracts

**Files:**
- Modify: `apps/api/app/schemas.py`
- Modify: `apps/api/app/main.py`
- Modify: `apps/api/tests/test_api.py`

**Interfaces:**
- Produces: `OfficialMetricOut`, `DerivedScoresOut`, `PlayerOut.official_metrics`, `PlayerOut.derived_scores`.
- Produces: `POST /api/v1/recruitment/rank` returning `RankedPlayer` records.

- [ ] **Step 1: Write contract tests**

```python
def test_player_contract_separates_official_and_derived(api):
    player = api.get("/api/v1/players?limit=1").json()["items"][0]
    assert "official_metrics" in player
    assert "derived_scores" in player
    assert set(player["official_metrics"]).isdisjoint(player["derived_scores"])


def test_invalid_component_weights_return_422(api):
    response = api.post("/api/v1/recruitment/rank", json={"weights": {"role_performance": 60, "opportunity": 20, "development": 15, "availability": 10, "confidence": 5}})
    assert response.status_code == 422
```

- [ ] **Step 2: Run contract tests and verify failure**

Run: `cd apps/api && UV_CACHE_DIR=/private/tmp/jscout-uv-cache uv run pytest tests/test_api.py -v`

Expected: FAIL because the new namespaces and endpoint do not exist.

- [ ] **Step 3: Define the response models**

`OfficialMetricOut` includes `value`, `unit`, `per90`, `listing_status`, `source_rank`, `source_url`, and `retrieved_at`. `DerivedScoresOut` includes `status`, five components, `value_proxy`, `methodology_version`, `metrics_used`, `metrics_unavailable`, `reasons`, and `limitations`.

- [ ] **Step 4: Add the recruitment endpoint**

Accept `minimum_minutes`, `position`, `limit`, and five component weights totaling 100. Query persisted component scores, apply requested component weights without recalculating role metrics, and sort using the deterministic tie policy.

- [ ] **Step 5: Preserve a compatibility response**

Keep `/api/v1/moneyball/rank` for one release, return the new response shape, and include a deprecation header pointing to `/api/v1/recruitment/rank`. Do not maintain the old formula.

- [ ] **Step 6: Update methodology response**

Return version `jleague-official-2025.2`, all five formula components, role profile definitions, eligibility thresholds, missing-data rules, and limitations.

- [ ] **Step 7: Run all backend tests**

Run: `cd apps/api && UV_CACHE_DIR=/private/tmp/jscout-uv-cache uv run pytest -v`

Expected: PASS, including HTTP 422 validation and deterministic ordering.

- [ ] **Step 8: Repository-owner review checkpoint**

Show OpenAPI diffs and example responses. Do not commit.

### Task 6: Adapt the frontend domain without duplicating the scoring engine

**Files:**
- Modify: `features/league-intelligence/types.ts`
- Modify: `features/league-intelligence/fixture-schema.ts`
- Modify: `features/api/client.ts`
- Modify: `features/league-intelligence/sample-data.ts`
- Modify: `features/league-intelligence/analytics.ts`
- Modify: `features/league-intelligence/analytics.test.ts`

**Interfaces:**
- Produces: TypeScript `PlayerMetricKey`, `OfficialMetric`, `DerivedScores`, and `RankedPlayer` matching Pydantic field semantics.
- Produces: `rankByComponentWeights(players, weights)` that combines existing canonical components only.

- [ ] **Step 1: Write Zod tests for listed zero and not-listed null**

```ts
expect(parseMetric({ value: 0, listingStatus: "listed" }).value).toBe(0);
expect(parseMetric({ value: null, listingStatus: "not_listed" }).value).toBeNull();
expect(() => parseMetric({ value: 0, listingStatus: "not_listed" })).toThrow();
```

- [ ] **Step 2: Write adapter tests for official/derived separation**

Assert snake-case API fields map to camel-case domain fields without substituting null official values with zero. Assert the API methodology version survives adaptation.

- [ ] **Step 3: Run focused frontend tests**

Run: `npm test -- --run features/league-intelligence/analytics.test.ts features/api`

Expected: FAIL because the new types and adapters do not exist.

- [ ] **Step 4: Add types and schemas**

Represent `officialMetrics` as `Partial<Record<PlayerMetricKey, OfficialMetric>>`; keep `derivedScores` in a distinct object. Keep the existing team-chart `MetricKey` unchanged. Remove the four legacy score fields from top-level `PlayerSeason` only after all consumers use `derivedScores`.

- [ ] **Step 5: Adapt API and local fallback**

The API adapter maps the new response. The local snapshot adapter consumes precomputed `derivedScores`; it must not reproduce percentiles or role formulas in TypeScript.

- [ ] **Step 6: Limit client-side weighting to five components**

```ts
export function weightedValueProxy(scores: DerivedScores, weights: ComponentWeights) {
  if (scores.status !== "scored") return null;
  return COMPONENT_KEYS.reduce((sum, key) => sum + scores[key]! * weights[key] / 100, 0);
}
```

- [ ] **Step 7: Run frontend unit tests**

Run: `npm test -- --run`

Expected: PASS with no duplicate role-performance formula in frontend files.

- [ ] **Step 8: Repository-owner review checkpoint**

Present the contract mapping and prove nulls remain null. Do not commit.

### Task 7: Rebuild Moneyball, Players, Compare, and Methodology views

**Files:**
- Modify: `app/moneyball/page.tsx`
- Modify: `app/players/page.tsx`
- Modify: `components/compare/compare-workbench.tsx`
- Modify: `app/methodology/page.tsx`
- Modify: `components/dashboard/recruitment-signals.tsx`
- Modify: `components/dashboard/decision-support.test.tsx`
- Modify: `e2e/league-intelligence.spec.ts`

**Interfaces:**
- Consumes: `PlayerSeason.officialMetrics`, `PlayerSeason.derivedScores`, and `weightedValueProxy` from Task 6.
- Produces: accessible recruitment ranking and metric evidence UI.

- [ ] **Step 1: Write UI tests for score naming and decomposition**

```tsx
expect(screen.getByText("Recruitment Value Proxy")).toBeVisible();
expect(screen.getByText("Role performance")).toBeVisible();
expect(screen.getByText("Data confidence")).toBeVisible();
expect(screen.getByText(/not a transfer valuation/i)).toBeVisible();
```

- [ ] **Step 2: Write UI tests for missing metrics and lower-confidence mode**

Render one `not_scored` player and assert “Not scored — insufficient official role metrics”. Switch minimum minutes to 450 and assert the discovery-mode warning is visible.

- [ ] **Step 3: Run component tests and verify failure**

Run: `npm test -- --run components/dashboard/decision-support.test.tsx`

Expected: FAIL because current UI still shows Moneyball and legacy score names.

- [ ] **Step 4: Update the ranking workbench**

Change the page heading and detail label to Recruitment Value Proxy. Add position and minimum-minute filters, sortable component columns, metrics-used/unavailable lists, formula decomposition, and the permanent non-valuation disclosure. Keep neutral surfaces and the existing restrained design system.

- [ ] **Step 5: Update Players and Compare**

Players shows position-relevant official metrics rather than one generic performance bar. Compare rejects cross-position score comparison with explanatory copy while still allowing factual bio/minutes comparison.

- [ ] **Step 6: Update dashboard signals and methodology**

Recruitment signals display the new methodology version and component reasons. Methodology includes worked examples for GK, DF, MF, and FW, small-sample shrinkage, missing-data rules, and team-influence limitations.

- [ ] **Step 7: Update end-to-end coverage**

Add tests for position filtering, 450/900 mode, one scored player detail, one not-scored state, weight validation, mobile overflow, and serious/critical Axe violations.

- [ ] **Step 8: Run unit and end-to-end tests**

Run: `npm test -- --run && npm run e2e`

Expected: all tests pass on desktop and mobile.

- [ ] **Step 9: Repository-owner review checkpoint**

Provide desktop/mobile screenshots and explain every displayed score component. Do not commit.

### Task 8: Documentation, regression, and repository hygiene

**Files:**
- Modify: `README.md`
- Create: `docs/learning/13-official-player-stats-pipeline.md`
- Create: `docs/learning/14-recruitment-value-proxy.md`
- Modify: `.gitignore`
- Modify: `docs/product/jleague-player-statistics-source-register.md`

**Interfaces:**
- Produces: portfolio-ready documentation and a reproducible verification checklist.

- [ ] **Step 1: Write the two learning documents**

The pipeline tutorial covers metric catalog, parser fixtures, identity audit, snapshot gate, database load, and null semantics. The score tutorial works through one player in each position from raw official values to adjusted percentiles and the final proxy.

- [ ] **Step 2: Update README claims**

Describe the product as a full-stack analytics product with a reproducible data pipeline. Remove the outdated 3D claim. State exactly which official metrics are included, which values are derived, the methodology version, and whether bulk official stats are publishable under the recorded usage decision.

- [ ] **Step 3: Extend ignore rules**

Ensure `.next/`, `test-results/`, `playwright-report/`, `*.tsbuildinfo`, `__pycache__/`, `.pytest_cache/`, `.venv/`, local `*.db`, and `.env*` except `.env.example` are ignored. Do not delete tracked files in this task; present tracked artifacts separately for owner-approved cleanup.

- [ ] **Step 4: Run the complete verification matrix**

```bash
npm test -- --run
npm run lint
npm run build
npm run e2e
cd apps/api && UV_CACHE_DIR=/private/tmp/jscout-uv-cache uv run pytest
```

Expected: all commands exit 0.

- [ ] **Step 5: Run data audits**

Assert exactly 20 clubs, at least 500 club-season records, no duplicate `(playerSeasonId, metricKey)`, no scored player below the selected threshold, no `not_listed` metric with a numeric value, and no derived field inside `officialMetrics`.

- [ ] **Step 6: Perform the manual official-source sample audit**

Compare five players per position against their official pages. Record player ID, club, metric, local value, official value, source URL, and pass/fail in the source register. Any mismatch blocks snapshot acceptance.

- [ ] **Step 7: Inspect the final Git diff**

Run: `git diff --check && git status --short`

Expected: no whitespace errors, no secrets, no generated build output, and only scoped source/docs/test changes. The implementing agent does not commit or push.

- [ ] **Step 8: Final repository-owner review checkpoint**

Hand over test results, source-usage status, audit results, screenshots, limitations, and the uncommitted diff for the owner to commit.

## Execution order and stopping conditions

Tasks run strictly in order because each later interface depends on the prior contract. Stop immediately when any of these occurs:

- source usage remains `research_only` and the next action would publish bulk extracted values;
- the official page structure cannot be parsed without brittle positional assumptions;
- more than 2% of eligible player identities are ambiguous or unmatched;
- fewer than 60% of a position profile's metric weight is available;
- a regression suite fails outside the scoped change;
- completing the next step would require a commit, push, secret, or external permission not provided by the owner.
