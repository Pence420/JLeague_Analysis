# J-Scout League Intelligence Vertical Slice — Design Specification

**Date:** 2026-09-22  
**Status:** Historical approved design  
**Scope:** Frontend-first vertical slice for the J-Scout home/league intelligence experience

## 1. Intent

Build a portfolio-grade J1 League scouting dashboard that feels like a professional recruitment workspace rather than a betting product. The first slice must establish the visual system, application shell, analytical depth, interaction model, and documentation style that later pages will reuse.

The product should help a recruitment analyst move through this reasoning chain:

1. What is happening across the league?
2. Which underlying factors help explain it?
3. Which clubs have distinctive or potentially unstable profiles?
4. Which players deserve closer investigation?
5. How reliable is each conclusion?

This slice uses clearly labeled synthetic J1-shaped sample data. It must not imply that sample values are official statistics or that analytical indicators are guarantees.

## 2. Agreed Product Scope

The first implementation slice includes:

- A responsive application shell.
- A floating island navigation system.
- A high-quality main League Intelligence page.
- A single interactive 3D team-style visualization with an accessible text/table alternative.
- Deterministic analytical summaries derived from local sample data.
- Reusable primitives for metrics, confidence, coverage, and analytical explanations.
- Loading, empty, error, reduced-motion, and WebGL fallback states.
- Per-part learning notes so the owner can study and extend the implementation.

The first slice does not include:

- A production backend or database.
- Authentication or authorization.
- File uploads, payments, password reset, or webhooks.
- Scraping or ingestion of real J.League data.
- Heatmaps, shot maps, passing networks, or other spatial claims.
- A production prediction model.
- The complete MVP route set from the PRD.

## 3. Visual Direction

### 3.1 Selected direction: Light Scouting Studio

The interface takes its structural cues from the provided modular dashboard reference while developing a distinct J-Scout identity.

- Warm off-white page canvas.
- White analytical surfaces with restrained borders and soft depth.
- Charcoal typography with strong scale contrast.
- A dark floating island navbar.
- J.League-inspired red as the identity accent.
- Controlled electric green for positive or efficient signals.
- Muted blue and amber for neutral comparison and caution states.
- Rounded geometry that feels precise and contemporary, not playful.
- Depth created through layering, shadows, and the 3D plot rather than heavy glassmorphism.

The design should remain spacious and legible on a small laptop. It must avoid nested-card clutter, decorative pills without meaning, sports-betting visual language, and gratuitous gradients.

### 3.2 Image-first design workflow

Each visually important page will be designed through the `image-to-code` workflow before implementation:

1. Generate a dedicated large visual reference for the page or major section.
2. Inspect hierarchy, typography, spacing, color, component rhythm, and responsive intent.
3. Regenerate unclear sections rather than guessing from compressed imagery.
4. Extract a reusable design system.
5. Implement the page faithfully in code.
6. Compare the running result against the reference and correct visual drift.

Future pages should share the same visual language without repeating the same layout.

## 4. Main Page Information Architecture

### 4.1 Island navigation

The desktop navigation floats near the top center and contains:

- J-Scout identity.
- League.
- Teams.
- Players.
- Moneyball.
- Compare.
- Methodology/data coverage access.

On narrow screens it becomes a reachable bottom island with a reduced set of primary destinations and an overflow menu. Active, hover, focus, and keyboard states must be unambiguous.

### 4.2 Context header

The header establishes analytical context rather than behaving like a marketing hero:

- “J1 League Intelligence” title.
- Season selector, initially J1 2025.
- Persistent “Synthetic sample data” status.
- Snapshot date.
- Minimum-minutes and methodology indicators.
- A compact statement explaining what the current view measures.

### 4.3 League State

Summarizes competitive strength using several signals rather than a raw league table alone:

- Points per match.
- Goal difference per 90.
- Underlying chance balance where the sample dataset provides the required fields.
- Recent consistency indicator based only on the available sample window.
- Coverage and sample-size context.

The presentation must separate observed results from derived interpretation.

### 4.4 3D Team Style Landscape

The primary visual maps clubs across three selectable analytical dimensions. Initial dimensions are:

- Attacking output.
- Possession/control.
- Defensive disruption.

Requirements:

- React Three Fiber/Three.js rendering.
- Rotation and zoom with bounded controls.
- Club selection through pointer, keyboard-accessible companion controls, and a searchable list.
- Clear axes, legends, and current metric definitions.
- Tactical clusters such as territorial controller, direct transition, and low-block counter, derived from configured rules.
- A synchronized text summary and sortable 2D data table.
- Reduced-motion mode and a non-WebGL fallback.

The chart must communicate real variables from the fixture dataset and must not be decorative 3D.

### 4.5 Performance vs Process

Compares observed outcomes with supporting performance indicators. It identifies teams whose results appear ahead of or behind their process while avoiding certainty language.

Each insight includes:

- The observation.
- Contributing metrics.
- Sample coverage.
- A cautious interpretation.
- A link or interaction that reveals the underlying values.

### 4.6 Sustainability Watch

Highlights potentially stable or fragile trends using:

- Difference between actual and underlying output.
- Consistency across the available sample window.
- Minutes/match coverage.
- Missing-field penalties.

This module is an analytical flag, not a forecast.

### 4.7 Recruitment Signals

Surfaces players who perform strongly after accounting for minutes, position group, and simple team context. Each candidate card includes:

- Player, club, position, age, and minutes.
- Opportunity/Moneyball signal.
- Two evidence factors.
- One explicit risk or limitation.
- Coverage percentage and confidence label.

No candidate below the configured eligibility or coverage threshold appears in the default list.

### 4.8 Role Supply Map

Shows which role archetypes appear scarce or abundant in the synthetic league pool. The module focuses on recruitment-market structure rather than presenting another player leaderboard.

### 4.9 Analyst Brief

Displays the three most important current findings. These sentences are generated from deterministic templates and ranked analytical rules, not authored as static marketing copy and not produced by an unconstrained chatbot.

Every statement exposes its evidence and methodology label.

### 4.10 Data Confidence

Coverage, source status, sample status, missing metrics, eligibility thresholds, and methodology version remain visible and easy to inspect. “Not available” is used for absent values; missing data is never silently converted to zero.

## 5. Technical Architecture

### 5.1 Frontend foundation

- Next.js with TypeScript.
- Tailwind CSS for tokens and layout.
- Accessible headless primitives where useful.
- React Three Fiber for the 3D visualization.
- Lightweight 2D charting only where it materially improves clarity.

The initial repository is empty, so the vertical slice establishes the project conventions rather than adapting an existing application.

### 5.2 Boundaries

The frontend is divided into focused modules:

- `app-shell`: page frame, responsive layout, global metadata, navigation.
- `dashboard`: page composition and dashboard-level state.
- `analytics`: pure calculation and deterministic insight functions.
- `data`: typed fixture repository and adapter interfaces.
- `charts`: 3D scene, 2D companions, legends, and accessible summaries.
- `ui`: metric, confidence, disclosure, status, and interaction primitives.

Components consume typed view models. Raw fixture rows do not flow directly into presentational components.

### 5.3 Data flow

```text
typed synthetic fixtures
  -> validation and normalization
  -> pure analytical calculations
  -> dashboard view models
  -> shared dashboard filters/state
  -> visual modules + text/table alternatives
```

The local data provider implements an adapter contract that can later be replaced with an API-backed provider without rewriting the page modules.

### 5.4 State model

Shared dashboard state contains only cross-module choices:

- Season.
- Selected team.
- 3D axis metrics.
- Role/position filter.
- Minimum-minutes preset.

Transient presentation state stays local to each component. Important filters should be URL-persistable when routing is introduced.

## 6. Analytical Rules for the Slice

- Count metrics use per-90 normalization only where valid.
- Comparisons use appropriate position or team groupings.
- Derived indicators disclose their contributing fields.
- Missing metrics remain null.
- Confidence declines with low sample coverage or missing inputs.
- Composite insights below the agreed minimum coverage do not rank.
- Tactical labels and Analyst Brief statements are deterministic and testable.
- No output is described as a guaranteed prediction.

The fixture dataset may be synthetic, but the calculation paths must behave like production analytical code.

## 7. Responsive and Accessibility Behavior

- Desktop uses an asymmetric modular grid at approximately 1280–1440 px content width.
- Tablet reduces column count without hiding analytical context.
- Mobile presents one intentional vertical sequence and a bottom island navigation.
- Key content remains usable without pointer input.
- All controls have visible focus states and accessible names.
- Color is reinforced with labels, shape, or iconography.
- The 3D plot has an equivalent text/table representation.
- Reduced-motion preferences disable non-essential movement.
- Loading skeletons preserve layout dimensions.
- Empty and error states explain the cause and offer a recovery action.

## 8. Quality, Security, and Launch Checklist

The user-provided security and “finished app” images are treated as a quality checklist. Only controls relevant to implemented capabilities are required; absent feature classes must not create fake security work.

### Required in this slice

- No hardcoded secrets or committed environment credentials.
- Safe public/private environment-variable boundaries.
- No debug leakage or sensitive values in errors/logs.
- Validate and constrain URL/search parameters and interactive numeric inputs.
- Render user-controlled text safely; do not introduce raw HTML injection paths.
- Dependency and source scan before handoff.
- Security headers appropriate to the static/frontend surface.
- No permissive CORS configuration introduced by the frontend scaffold.
- Custom 404 page.
- Unique page title and meta description.
- Favicon and share metadata.
- Image alternative text where images convey meaning.
- Mobile breakpoints.
- Loading, empty, and error states.
- No accidental analytics or tracking installation.
- Optimized local imagery/assets.

### Deferred until a feature requires them

- Authentication, authorization, admin roles, session security, password storage, and password reset.
- Database access rules and SQL injection controls.
- File upload validation and malware scanning.
- CSRF protection for state-changing authenticated operations.
- Rate limiting for server endpoints.
- Webhook signature validation.
- Payment verification.
- Privacy, terms, and cookie-consent flows that depend on deployment jurisdiction and actual tracking/data collection.

Deferred items must be revisited when their corresponding capability enters scope.

## 9. Testing and Verification

### Unit tests

- Metric normalization.
- Null/missing-value behavior.
- Coverage and confidence classification.
- Tactical-cluster assignment.
- Sustainability flags.
- Recruitment-signal eligibility.
- Analyst Brief rule selection.
- 3D coordinate transformation.

### Component tests

- Navigation and keyboard behavior.
- Metric/axis selection.
- Loading, empty, error, and unsupported-WebGL states.
- Evidence disclosure.
- Mobile navigation behavior.

### End-to-end and visual checks

- Main analytical journey on desktop and mobile.
- No horizontal overflow at agreed breakpoints.
- Reduced-motion behavior.
- Metadata and custom 404.
- Automated accessibility smoke check plus manual keyboard pass.
- Screenshot comparison against the generated design reference.
- Production build and lint/type/test commands.

## 10. Learning Documentation

The implementation will include focused learning notes under `docs/learning/`:

1. `01-app-shell-and-island-navigation.md`
2. `02-data-contracts-and-analytics.md`
3. `03-building-the-3d-team-landscape.md`
4. `04-accessible-chart-alternatives.md`
5. `05-responsive-dashboard-composition.md`
6. `06-testing-and-security-checks.md`

Each note contains:

- The problem the part solves.
- The relevant mental model.
- A guided map of the implementation.
- Data and event flow.
- Important trade-offs.
- Common failure modes.
- A small exercise for the owner to complete independently.

## 11. Future Page Design Rule

League, Teams, Player Explorer, Player Profile, Moneyball, Compare, European Fit, Reports, and Methodology pages will receive their own image-first design pass when they enter scope. They will reuse tokens and primitives from this slice but vary composition according to the analytical task. No future page should be produced as a generic duplicate of the home dashboard.

## 12. Definition of Done for This Slice

- The main page follows the approved Light Scouting Studio direction.
- The analysis communicates findings, evidence, limitations, and confidence.
- The 3D visualization is interactive, meaningful, and accessible through an alternative representation.
- Synthetic data is labeled throughout.
- The primary flows work across desktop and mobile.
- Loading, empty, error, reduced-motion, and WebGL fallback states exist.
- Relevant security and launch checks pass.
- Tests, type checking, linting, and production build pass.
- Learning notes are complete for every implemented part.
- The implementation is ready for a later API adapter without component rewrites.

## 13. Known Deviation from the PRD

The PRD recommends beginning with full monorepo, API, PostgreSQL, migrations, and seed infrastructure. The user explicitly selected a frontend vertical slice first. This design therefore establishes the application experience and typed data boundary before the backend foundation. The production analytics ownership rule remains intact: when the Python API is introduced, authoritative calculations will move behind the API and the frontend adapter will consume prepared outputs.
