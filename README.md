# J-Scout

J-Scout is an evidence-led J1 League recruitment analytics interface. This repository currently contains the first frontend vertical slice: a League Intelligence dashboard, deterministic analytical summaries, and an interactive 3D team-style landscape.

> All current clubs, players, and statistics are **synthetic sample data**. The scores are decision-support signals, not predictions, guarantees, or substitutes for professional scouting.

## Run locally

Requirements: Node.js 20+ and npm 10+.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Quality commands

```bash
npm test
npm run lint
npm run build
npx playwright test
```

Install the Playwright browser once if needed:

```bash
npx playwright install chromium
```

## Project structure

```text
app/                              Next.js routes and global states
components/app-shell/             Navigation and application frame
components/charts/                3D visualization and HTML alternative
components/dashboard/             Analytical page modules
features/league-intelligence/     Types, validation, fixtures, analytics, state
docs/design/                      Generated visual references and analysis
docs/learning/                    Indonesian learning modules
e2e/                              Browser, responsive, and accessibility tests
```

## Why the 3D chart has an HTML equivalent

Canvas content is not a reliable semantic interface for screen readers, keyboard-only users, reduced-motion users, or browsers without WebGL. The Team Style Landscape therefore renders a synchronized table and written interpretation from the same `TeamLandscapePoint[]` data. The fallback is not separate data and cannot drift independently.

## Data boundary

The current `sample-data.ts` fixture is validated by Zod before calculations run. Components consume a typed `LeagueDashboardViewModel`; they do not calculate methodology themselves. When the FastAPI service enters scope, a provider adapter can supply the same validated domain shape while authoritative analytics move behind the API.

## Known limitations

- There is no production backend, database, or licensed J.League dataset yet.
- Authentication, saved shortlists, exports, and reports are outside this slice.
- No spatial event visualization is shown because no coordinate-level source exists.
- Tactical labels are deterministic sample rules, not a trained model.
- Generated design references may contain visual-only text or identities; implementation data remains fictional and labeled.

## Learn the implementation

Start with [`docs/learning/01-app-shell-and-island-navigation.md`](docs/learning/01-app-shell-and-island-navigation.md), then continue numerically through analytics, 3D rendering, accessibility, responsive composition, and testing/security.

## Design source

The implementation follows the Light Scouting Studio references in `docs/design/`. The application intentionally corrects generated-image artifacts such as the wrong season or apparent real-world identities.
