# J.League player statistics and recruitment value design

## Status

Approved design direction. This document defines the next implementation scope; it does not authorize data ingestion or production deployment until the source-usage review passes.

## Goal

Enrich the existing J1 2025 player records with official J.LEAGUE player statistics and replace the current age-and-minutes-heavy Moneyball formula with a position-aware, sample-adjusted Recruitment Value Proxy.

## Non-goals

- Estimating a player's transfer fee, salary, or resale value.
- Predicting future performance as a fact.
- Treating missing leaderboard entries as zero.
- Scraping official pages at application runtime.
- Replacing human scouting or video review.

## Source and usage gate

The intended source is the official 2025 J1 player-statistics catalogue:

- `https://www.jleague.jp/sp/stats/j1/player/2025/all/assist/?mode=pc`
- `https://data.j-league.or.jp/SFPR01/search`

Before bulk ingestion, record whether the project may store, transform, and display each metric. The public statistics pages state that copying or republishing site content without permission is prohibited and identify Data Stadium as the data provider. If the intended use is not permitted, implementation stops at an importer prototype that does not commit or publish extracted data.

## Current limitation

The current dataset has identity, physical profile, appearances, minutes, and goals. Its derived `performance`, `potential`, `opportunity`, and `availability` fields are based mainly on minutes, appearances, goals, and age. This makes cross-position ranking weak: defenders and goalkeepers cannot be assessed fairly, and a player's ranking can be driven too strongly by age.

## Data architecture

### Immutable source snapshot

The importer continues to run manually. It writes one reviewed, dated snapshot; the web application never scrapes J.LEAGUE at runtime.

Each official value carries:

- metric key and display name;
- raw value and unit;
- season and competition;
- official player identifier when available;
- source URL and retrieval date;
- listing status: `listed`, `not_listed`, or `unavailable`;
- source rank when the official page supplies one.

`not_listed` remains `null`. It must never be converted to `0`, because official category pages can show only a limited ranking rather than every player.

### Storage boundary

Keep stable identity and season facts in `players` and `player_seasons`. Store variable official statistics in a separate `player_metric_values` table keyed by player-season and metric key. Store calculated component scores in `player_score_snapshots`, including the methodology version and calculation timestamp.

This separation prevents official facts from being overwritten by formulas and allows a scoring methodology to be recalculated without re-importing the source pages.

### Metric groups

- Attacking: assists, shots, shots on target, shot conversion, xG, non-penalty xG, goals minus xG, chances created, dribbles, and crosses.
- Distribution: passes, pass completion, opposition-half passes, own-half passes, long passes, and through passes.
- Defending: tackles, tackle success, interceptions, blocks, clearances, aerial duels, total duels, fouls, and cards.
- Goalkeeping: shots faced, saves, save rate, clean sheets, area-specific save rates, crosses claimed, and punches.
- Physical: distance, top speed, total sprints, and possession-state sprint totals.

The first release should import only metrics needed by the scoring model and visible player pages. Additional official categories can be added later without changing the core player tables.

## Identity matching

Prefer the official player identifier embedded in source links. If an identifier is unavailable, match by normalized Japanese name plus club and season. Every fallback match must be written to an audit report with `matched`, `ambiguous`, or `unmatched` status. Ambiguous players receive no advanced statistics until reviewed.

Mid-season transfers remain separate club-season records but share the same official player identity. Scores are calculated per club-season record unless a later feature explicitly introduces combined-season views.

## Normalization

### Per-90 values

Count metrics use:

```text
per90 = raw_value / minutes * 90
```

Rates already published as percentages remain percentages. Distance and sprint metrics retain their official unit and are normalized only during percentile calculation.

### Eligibility

- Default minimum: 900 league minutes.
- Discovery mode: 450 league minutes, clearly labeled as lower confidence.
- Zero-minute players never receive a score.

### Position cohorts

Percentiles are calculated separately for `GK`, `DF`, `MF`, and `FW`. No global percentile may directly compare different position groups.

### Small-sample shrinkage

Raw position percentiles are pulled toward the neutral score of 50:

```text
reliability = min(1, minutes / 1800)
adjusted_percentile = 50 + reliability * (raw_percentile - 50)
```

This prevents a 450-minute outlier from outranking a full-season performer solely because of a small sample.

## Role-performance profiles

Each position uses official metrics that match its responsibilities. Weights apply only when the metric is available; missing weights are redistributed across available metrics and reduce confidence.

### Forwards

- 25% non-penalty xG per 90
- 20% goals per 90
- 15% assists per 90
- 15% chances created per 90
- 10% shots on target rate
- 10% dribble success
- 5% duels won per 90

### Midfielders

- 20% chances created per 90
- 15% assists per 90
- 15% opposition-half pass completion
- 15% through passes per 90
- 10% dribble success
- 10% duels won per 90
- 10% interceptions per 90
- 5% goals minus xG

### Defenders

- 20% duels won per 90
- 20% aerial-duel win rate
- 15% interceptions per 90
- 15% tackles per 90
- 10% tackle success
- 10% clearances plus blocks per 90
- 10% pass completion

### Goalkeepers

- 35% save rate
- 20% penalty-area shot save rate
- 15% saves per 90
- 10% cross claim rate
- 10% clean-sheet rate
- 10% distribution completion

Clean sheets and goals conceded are team-influenced; the interface must disclose that limitation.

## Recruitment Value Proxy

The default composite is:

```text
value_proxy =
  0.50 * role_performance
  + 0.20 * opportunity
  + 0.15 * development
  + 0.10 * availability
  + 0.05 * confidence
```

### Components

- `role_performance`: weighted mean of the player's adjusted, position-specific metric percentiles.
- `opportunity`: `0.60 × role_performance + 0.40 × (100 − usage_percentile)`. It identifies productive players receiving fewer minutes, but cannot mean transfer availability.
- `development`: `0.60 × performance_percentile_within_age_band + 0.40 × age_runway`. Age bands are `≤21`, `22–24`, `25–28`, and `29+`; age runway declines gradually and is never presented as a forecast.
- `availability`: percentage of the club's maximum league minutes, capped at 100.
- `confidence`: weighted coverage of the role metrics after identity-match and listing-status checks.

The score is rounded only for display. Sorting uses the unrounded value and resolves ties by confidence, minutes, then stable player ID.

## API contract

Player responses expose official metrics under `official_metrics` and derived values under `derived_scores`. Each metric includes value, unit, per-90 value when applicable, listing status, and source metadata.

The ranking endpoint returns:

- final score and methodology version;
- all five component scores;
- role-profile name;
- metrics used and metrics unavailable;
- eligibility and confidence;
- concise reasons and limitations.

Weight overrides must total 100. They may reweight the five components but may not alter the role-profile metric definitions.

## Frontend behavior

Rename the user-facing “Moneyball score” to “Recruitment Value Proxy”. Keep the navigation label only if product naming still requires “Moneyball”.

The page shows:

- position and minimum-minutes filters;
- the default methodology and optional component-weight presets;
- sortable score, role performance, opportunity, development, availability, and confidence columns;
- a detail panel listing official inputs, per-90 values, unavailable metrics, formula decomposition, and limitations;
- a persistent statement that the score is not a transfer valuation or scouting verdict.

The Compare and Players pages consume the same official metric contract rather than recomputing independent formulas.

## Failure handling

- A changed source page fails the importer instead of silently producing partial data.
- Duplicate or ambiguous identities are exported to an audit report and excluded from scoring.
- Missing leaderboard rows remain null.
- A player with insufficient role metrics receives `not_scored`, not zero.
- An invalid weight total returns HTTP 422.
- The last reviewed snapshot remains usable if a refresh fails.

## Verification

- Parser fixtures cover one page from every imported metric group.
- Identity tests cover transfers, ambiguous names, and unmatched players.
- Formula tests cover every position, missing metrics, small samples, ties, and zero minutes.
- Contract tests verify official and derived namespaces never overlap.
- Frontend tests verify decomposition, missing-state copy, filters, and keyboard interaction.
- End-to-end tests cover API mode, local fallback mode, mobile overflow, and serious accessibility violations.
- A manual source audit compares at least five players per position against official pages before accepting a snapshot.

## Documentation deliverables

- Source inventory and usage decision.
- Metric dictionary with units and directions.
- Formula methodology and worked examples for GK, DF, MF, and FW.
- Import and identity-resolution tutorial.
- A changelog entry whenever the methodology version changes.

## Repository naming

New product documentation belongs in `docs/product/`. Implementation notes belong in `docs/engineering/`, and learning material remains in `docs/learning/`. Do not create agent-branded folders for future work.
