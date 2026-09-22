# League Intelligence Reference Analysis

## Layout and hierarchy

The primary reference uses a 16:10 desktop canvas with a two-level header. A compact identity block sits at the far left, while a dark navigation island is centered independently above the content. The page title and context filters occupy the second header row.

The analytical grid follows a clear hierarchy:

1. League State occupies a narrow left rail.
2. Team Style Landscape is the largest and widest module.
3. Performance vs Process and Data Confidence form a narrower right rail.
4. Sustainability Watch, Recruitment Signals, and Role Supply Map create a balanced lower row.
5. The secondary reference expands Analyst Brief into a wide evidence-led section, followed by three smaller supporting modules.

The coded page should preserve the hierarchy rather than copying every generated card literally. Analyst Brief must remain prominent even though the first generated reference omitted it.

## Typography scale

- Page display: approximately 44–52px on desktop, 32–38px on mobile, weight 750–850, tight tracking.
- Major module title: 22–28px, weight 700–800.
- Supporting label: 12–14px, weight 600–700, uppercase only for status or evidence categories.
- Body copy: 14–16px with 1.45–1.6 line height.
- Primary metric: 28–42px, weight 650–800.
- Table data: 13–15px with tabular numerals.

Use a refined grotesk hierarchy with strong contrast between analytical statements and supporting evidence. Avoid uniformly small dashboard text.

## Color tokens

- Canvas: `#f4f3ef`.
- Primary surface: `#ffffff`.
- Soft surface: `#f8f8f5`.
- Primary ink: `#151619`.
- Muted ink: `#6f7279`.
- Hairline border: `#dedfda`.
- Navigation: `#1e2024`.
- Identity red: `#ed1b2f`.
- Positive green: `#20a65a`.
- Comparison blue: `#3578db`.
- Caution amber: `#eca51a`.
- Negative/risk red: `#e6404c`.

Red identifies J-Scout and important analytical markers. Green is reserved for positive evidence and confidence. Blue handles neutral comparison. Amber communicates uncertainty; color never carries meaning without text.

## Spacing and radius rules

- Maximum content width: 1440px.
- Desktop side gutter: 24–32px.
- Section/module gap: 12–16px.
- Card padding: 20–24px.
- Large vertical section spacing: 24–32px.
- Surface radius: 16–20px.
- Island navigation radius: 22–28px.
- Control radius: 10–12px.
- Mobile touch target: at least 44px.

The composition is dense enough to feel analytical but keeps clear internal grouping. Do not wrap the entire grid in another card.

## Depth and border rules

Surfaces use a one-pixel neutral border and a restrained shadow such as `0 16px 40px rgba(24, 28, 36, 0.06)`. The island navigation receives slightly stronger lift. The 3D plot creates the primary sense of depth; other cards should remain matte and quiet.

Avoid glass blur, colored outer glow, strong gradients, and multiple nested elevations.

## Island navigation behavior

The island is visually detached from the identity block and content grid. The active destination uses a red underline rather than a filled pill. Navigation labels remain plain and readable. Search and utility actions are secondary.

Below 768px, the implementation moves the primary destinations to a fixed bottom island and places less frequent destinations in an accessible overflow menu. Page padding must prevent the island from covering content.

## Chart and evidence relationship

The 3D landscape is the visual focal point, but it is not decorative. Each point must map to three named values and a tactical cluster. Selection reveals a written explanation, coverage, and the exact values. A complete HTML table remains available for keyboard, screen-reader, reduced-motion, and WebGL-fallback use.

Performance vs Process and Sustainability Watch use simpler 2D relationships so the page has only one complex spatial visualization.

## Analyst Brief structure

The second reference establishes the strongest evidence pattern:

1. Ranked finding and one-sentence summary.
2. Observation.
3. Two or three evidence metrics.
4. Cautious interpretation.
5. Confidence, coverage, and one key limitation.

This pattern becomes the reusable J-Scout analytical explanation language. It is more important than reproducing the generated club logos or player photos.

## Desktop-to-mobile transformation

- Two-column context header becomes a single stack.
- The main grid becomes a deliberate vertical sequence rather than a squeezed masonry layout.
- Team Style Landscape appears before League State on mobile because it is the main analytical interaction.
- Long tables scroll inside their own region.
- Analyst Brief changes from wide rows to stacked evidence blocks.
- Data Confidence stays visible near the top and again at the end as a concise disclosure.
- The canvas keeps a useful minimum height, while its companion controls sit outside the WebGL surface.

## Details intentionally excluded

- The generated images accidentally display `J1 2024`; the product implementation must use `J1 2025` from the approved specification.
- Generated real-club names, crests, player names, portraits, and numbers are visual artifacts only. They must not enter the fixture because no licensed source has been supplied.
- The implementation will use fictional club and player identities with a persistent synthetic-data label.
- No heatmap, shot map, passing network, betting odds, predicted transfer, or guaranteed outcome is introduced.
- Tiny utility copy and ornamental status pills are reduced in favor of readable evidence.
