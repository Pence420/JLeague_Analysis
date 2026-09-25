# J.League Player Statistics Source Register

## Decision

As of 2026-09-24, the official J.League player-statistics source is classified as `research_only` for this repository.

This decision means J-Scout may contain the source contract, small hand-reviewed parser fixtures, synthetic test data, and code that can process approved data later. It must not contain or publicly serve a bulk extraction of the official advanced-stat leaderboards until written permission or applicable licensing terms are recorded and this register is changed to `approved`.

## Source record

| Field | Recorded value |
| --- | --- |
| Source owner | Japan Professional Football League (J.LEAGUE) |
| Data provider shown by J STATS | Data Stadium Inc. |
| Competition and season | Meiji Yasuda J1 League, 2025 |
| Public statistics family | J STATS player rankings |
| Example page | `https://www.jleague.jp/sp/stats/j1/player/2025/all/assist/?mode=pc` |
| Retrieval method under review | Manual, versioned import from a reviewed page snapshot; never a runtime scrape |
| Public-page limitation | Each leaderboard exposes only the leading 200 rows, so an absent player is unknown/not listed rather than zero |
| Intended use | Non-commercial portfolio demonstration of scouting analysis and data-engineering methods |
| Repository status | `research_only` |
| Decision date | 2026-09-24 |

## Why this is gated

The public J.League pages identify the statistics service as J STATS and attribute the data to Data Stadium. J.League's public property guidance also states that its protected material must not be copied or republished without authorization. A portfolio project being non-commercial does not by itself grant republication rights.

The official business-services page provides the correct route for asking about use of J.League data and properties. Approval must therefore be documented before bulk values are checked into Git or exposed by a public deployment.

## Allowed while status is `research_only`

- Keep `data/jleague/metric-catalog.json` as a metadata-only description of the intended official fields.
- Commit minimal, hand-reviewed HTML fixtures containing only enough altered or synthetic rows to verify parsing behavior.
- Test zero values, percentages, missing leaderboard entries, duplicate names, and transfer identity handling.
- Build database tables, API contracts, advanced-metric score tests, and gated UI states using synthetic fixtures.
- Derive and display clearly labeled Opportunity, Age development, Availability, and Data confidence components from the separately approved official appearance snapshot; do not treat them as advanced J STATS metrics.
- Show a clear `Official data unavailable` or `Not listed in official top 200` state rather than inventing a number.

## Not allowed while status is `research_only`

- Download or commit the complete set of official player-stat leaderboard values.
- Treat absence from a top-200 page as a zero.
- Run a scraper from the production application.
- Present synthetic fixture values as official J.League facts.
- Publish derived rankings that implicitly reproduce a gated bulk dataset.

## Approval path

1. Contact J.League through its official business-services/data-use route and describe the exact fields, 2025 season, portfolio purpose, storage method, and public presentation.
2. Record the written response and any attribution, retention, rate, or redistribution conditions outside the public repository if the response is confidential.
3. Update this register with the approval date, permitted scope, required attribution, and evidence reference.
4. Change `usageStatus` here and in `data/jleague/metric-catalog.json` to `approved` only when the requested implementation is inside that scope.
5. Run the reviewed manual importer and inspect its audit report before any snapshot is committed.

## Engineering consequence

The pipeline must fail closed. The importer may expose an explicit `--include-official-stats` option, but it must refuse to write official values unless the catalog status is `approved`. Missing source permission is a product state, not an error to hide and not a reason to substitute made-up data.
