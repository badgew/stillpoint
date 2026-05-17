# Backlog

Deferred decisions, watched smells, and open design questions for Stillpoint. The responsive design plan (`responsive-design-plan.md`) is the stable reference for how the system works; this file is the changing list of what's pending, why, and when to revisit.

Each item names a *trigger condition* — the observation that should cause us to act — rather than a deadline. If the trigger fires, do the work. If not, leave it.

## Active watches

### Mobile breathing room at narrow widths

After the May 2026 wordmark tuning (and subsequent manual dial-in), the right-edge gap between the wordmark and the page edge scales with `--frame-pad-top` via `--frame-pad-offset-ratio` (currently `0.15`). At 320px viewport this resolves to ~4.8px — very tight. Desktop sizes look right; mobile is unverified at this writing.

**Trigger to act:** if mobile testing shows the wordmark visibly cramping the page edge or escaping the safe area, split `--wordmark-spacing` off into its own non-proportional token. Suggested shape: `--wordmark-gap: clamp(0.75rem, 2.5vw, 3rem)` with its own clamp curve, decoupled from frame padding. This lets the gap stay substantial on mobile without forcing it up on desktop — the desktop value is currently the design's right call, so a coupled token can't simultaneously serve both.

### `--wordmark-spacing` double-duty

`--wordmark-spacing` is applied to both the top wordmark (positioned in `.frame`'s `padding-top` zone) and the bottom wordmark (positioned in `.main-content`'s `padding-bottom` zone — `.frame` itself has `padding-bottom: 0` for the sticky-sidebar reason). Today this is safe because both source paddings happen to come from `--space-fluid-lg`, so they produce the same value.

**Trigger to act:** the day `--frame-pad-top` and `--frame-pad-bottom` diverge for any reason, the bottom wordmark's inset will be silently wrong. If that happens, introduce `--wordmark-spacing-top` and `--wordmark-spacing-bottom` derived from their respective source paddings. Or, if the coupling is intentional design intent, document it explicitly so the next person knows not to diverge them casually.

## Deferred architectural decisions

### Content-region wrapper for `cqi`-based wordmark sizing

The design plan's "Why not container queries" section notes that wordmarks can't be sized in `cqi` against `.main-content` because they're siblings of it, not descendants. A wrapper element (`.content-region`) around the wordmarks + `.main-content` would make container queries work. But the wrapper has to split the frame's padding — `padding-right` moves to the wrapper while `padding-top` and `padding-left` stay on `.frame` to keep spacing the sidebar. The result: three elements own padding instead of two (`.frame` for top/left, the wrapper for right, `.main-content` for bottom).

**Considered May 2026, deferred.** The wrapper works and replaces the fragile `--content-area-width` calc with intrinsic `cqi` measurement, but fragments padding ownership in a way that wasn't worth it for the immediate whitespace tuning.

**Triggers to revisit:**

1. A second padding-zone element appears — something else that needs to live in the frame's padding and be sized proportionally to the content area. At that point the calc-based math has to be duplicated, and the wrapper pays for itself.
2. The `--content-area-width` calc bites in a concrete way — most likely Windows scrollbar gutter making `100vw` overshoot the actual rendered width, or a layout change (e.g., adding `max-width` somewhere) that invalidates the calc's assumptions.
3. We want to add other dimensions that should scale with content width rather than viewport (e.g., `cqi`-based hero typography).

## Open mobile design questions

Decisions the design hasn't made yet. Listed as questions rather than tasks — the answer determines the work.

1. Sidebar layout below ~640px: stay sticky in a left column, or collapse horizontally above the main content? Today it stays sticky, which works but eats horizontal space on small viewports.
2. Whether `position: sticky` should be disabled on `.sidebar` at narrow widths. If the sidebar collapses to a horizontal nav, sticky becomes a different decision (sticky top header vs. scrolls away with content).
3. Whether the wordmark L's should collapse, scale further, or hide entirely on mobile. Current behavior keeps them visible at all widths via the `10rem` and `12rem` floors. A design call could drop those floors, hide via media query, or restructure to a single-orientation logo at small sizes.

When any of these is answered, capture the decision here briefly and move implementation work into the active watches above.

## Recently shipped

**May 2026** — Font delivery uplift for production.

Both webfonts converted from OTF to WOFF2 (RiformaLL-Regular 108 → 50 KB, Youth-Bold 139 → 61 KB — combined payload 247 → 111 KB, ~55% reduction). Added `font-display: swap` to both `@font-face` rules so fallback text paints immediately instead of sitting in the default ~3s FOIT window. Added `<link rel="preload" as="font" type="font/woff2" crossorigin>` in `<head>` for both faces so the browser starts the font fetch in parallel with stylesheet parsing rather than after CSS is parsed and the `@font-face` URLs discovered.

The conversion was done with the new CLI tool at `~/www/_utilities/fonts/otf2woff2` (fontTools + brotli wrapper). The original `.otf` files are still in `assets/fonts/` but no longer referenced from CSS — safe to delete in a cleanup pass.

**Not yet done — second-pass optimizations available:**

1. *Subsetting.* `Youth-Bold` is used only on a handful of section labels and short headings. Running it through `pyftsubset` with `--unicodes="U+0020-007E,U+00A0-00FF"` plus dropping unused OpenType features can shave another 40–70% off the display face. `RiformaLL` is harder to subset aggressively (handles arbitrary body copy) but Basic Latin + Latin-1 + smart quotes is usually safe. Trigger to act: when overall page weight or LCP becomes a measured concern, or when the subsetting variant of the converter tool is built out.
2. *Licensing audit.* Both RiformaLL and Youth are commercial fonts. Self-hosting them as WOFF2 typically requires a webfont-tier license that's distinct from the desktop license. Trigger to act: before this site sees public traffic — verify EULAs cover web self-hosting (and subsetting, if/when that's done) and document license records somewhere durable.

**May 2026** — Wordmark sizing and frame padding tuned for whitespace, in two passes.

*Wordmark widths* (architecture discussion): top coefficient `0.55 → 0.40`, max `32rem → 26rem`. Bottom coefficient `0.85 → 0.62`, max `50rem → 38rem`. Shrinks the wordmark so its left edge clears the hero/footer image with visible breathing room.

*Frame padding zone* (manual dial-in after first pass): `--space-fluid-lg` middle term `8vw → 10vw` so the padding zone scales up faster across the viewport range. `--frame-pad-offset-ratio` `0.25 → 0.15` to bring the wordmark close to the page edge *inside* the now-larger padding zone. Net effect: more total whitespace between main-content and page edge, with the wordmark hugging the page edge within that zone. At 1440px viewport the padding zone went 115px → 144px while wordmark inset went 52px → 22px.

Also documented the three-knob clamp model (min / coefficient / max operate in disjoint viewport ranges) in both `styles.css` comments and the responsive design plan, so the next round of tuning finds the right knob faster.
