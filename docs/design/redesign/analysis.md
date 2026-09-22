# J-Scout restrained redesign analysis

## Direction

The six generated references converge on a quiet analytical workbench rather than a portfolio showcase. The UI uses warm white, charcoal, warm gray, and one muted burgundy accent. Color appears only for active selection, comparison identity, or a warning that cannot be communicated by text alone.

## Shared system

- Canvas `#f7f6f3`; surfaces `#ffffff`; soft row selection `#f5edef`.
- Ink `#202124`; secondary text `#77736f`; divider `#e8e6e2`.
- Accent `#7f1734`, used sparingly. No gradients or rainbow series.
- Page titles 30–36px, module titles 17–22px, body/table text 13–15px.
- Radius 8px for controls and 10–12px for major panels.
- Shadows are nearly absent; structure comes from dividers and alignment.
- Navigation is a compact top island with a dark active destination.
- Tables are first-class working surfaces, not decorative content inside card piles.

## Page-specific structure

- **League:** grayscale 3D style landscape, league table, three compact leaderboards, one analyst note.
- **Teams:** sortable team table and persistent selected-team inspection rail.
- **Players:** filterable player table, selection checkboxes, shortlist rail, CSV export.
- **Moneyball:** role/preset controls, validated weights, live re-ranking, selected-player decomposition.
- **Compare:** two player selectors, shared-metric radar, paired percentile bars, role fit, limitations.
- **Methodology:** document layout with table of contents, formulas, data coverage, and version history.

## Interaction rules

- Every navigation item resolves to a real route.
- Rows select without navigating unexpectedly; explicit links open profiles.
- Filters operate immediately and preserve meaningful empty states.
- Compare accepts two selected players through URL query parameters.
- Custom Moneyball weights must total 100 before recalculation.
- All API-backed pages show loading, retry, and local-demo fallback status.

## Intentional corrections to generated images

Generated references contain foreign leagues, market values, real provider names, and unverified formula wording. Those are visual artifacts only. The implementation uses J1 2025-shaped synthetic records, Opportunity Score when market data is absent, rule-based European fit language, and the methodology already defined by J-Scout.
