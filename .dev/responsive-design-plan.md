# Responsive Design Plan

A reference for how Stillpoint's CSS handles responsiveness. Read this before changing layout-level CSS or sizing-related variables. Most of the rationale here is also encoded as comments in `styles.css`; this doc is the longer-form explanation.

For in-flight work, deferred decisions, and open design questions, see `backlog.md` in this directory. This file is the stable reference; the backlog is the changing list.

## Goals

- Layout scales smoothly across viewports without relying on a thicket of media query breakpoints.
- Wordmarks ("STILL/POINT" top, "FIND YOUR/QUIET PLACE" bottom) maintain their L-shaped relationship with the content area at every viewport size.
- Typography respects user font-size preferences and browser zoom — fluid scaling must not break accessibility.
- Mobile browser quirks (URL bar showing/hiding) don't break full-viewport heights.

## Unit Strategy

Three units, three jobs:

**`rem`** — for typography and fixed-scale UI (gaps, padding, border-radius, button proportions). Root-relative, predictable, respects user font-size preferences.

**`clamp(min, fluid-middle, max)`** — for things that should grow with the viewport but have sane limits (frame padding, wordmark widths, sidebar width, display typography).

**`%`** — where the value should mirror the parent. Used sparingly.

**`dvh`** — for full-viewport heights (`100dvh` instead of `100vh`) so iOS Safari and Android Chrome don't crop content when the URL bar shows/hides.

## The Accessibility Rule

**Never use raw `vw` in the middle of a `clamp()` for font-sizes.** Doing so means user font-size preferences and OS-level text scaling are ignored — the text only responds to the window dimensions.

Wrong:

```css
font-size: clamp(1.25rem, 2.5vw, 2rem);   /* breaks user font-size scaling */
```

Right:

```css
font-size: clamp(1.25rem, 1rem + 1.5vw, 2rem);  /* rem floor keeps it accessible */
```

The `rem` term in the middle is what keeps the user's setting in play. For non-text values (structural spacing like frame padding), pure `vw` middles are acceptable.

## Fluid Space Tokens

Defined in `:root` and reused throughout. Tweak the `vw` coefficient on any of these to make scaling more or less aggressive across the board.

```css
--space-fluid-lg: clamp(13vw, 10vw, 9.375rem);   /* see note below */
--space-fluid-md: clamp(1rem, 3vw, 2.5rem);       /* 16px → 40px  */
--space-fluid-sm: clamp(0.625rem, 2vw, 1.25rem);  /* 10px → 20px  */
```

### Note on `--space-fluid-lg`

The min term (`13vw`) is larger than the middle term (`10vw`) at every viewport, and `clamp()` semantics give MIN precedence over MAX when MIN > MAX. The practical effect is that `--space-fluid-lg` resolves to `13vw` at all viewports — the middle and max are inert. This was reached through manual tuning, and the resulting padding zone is the visual target. If a future cleanup pass wants the clamp to behave conventionally, the simplest equivalent is:

```css
--space-fluid-lg: 13vw;
```

…or, if a max is desired, raise the max above `13vw` at the upper viewport range (e.g., `clamp(4rem, 13vw, 16rem)`).

### Frame padding derived from these tokens

Frame padding values reference the tokens so changes cascade:

```css
--frame-pad-top:    var(--space-fluid-lg);
--frame-pad-right:  var(--space-fluid-lg);
--frame-pad-bottom: var(--space-fluid-lg);
--frame-pad-left:   var(--space-fluid-md);
```

`.frame` itself applies only top/right/left — bottom is hard-coded to `0` so the sticky sidebar's containing block can extend to the bottom of the page (see Sidebar). The bottom padding is applied to `.main-content` instead via `padding-bottom: var(--frame-pad-bottom)`. Today `--wordmark-spacing` is derived from `--frame-pad-top`, but it's applied to *both* wordmarks — see the `backlog.md` entry "wordmark-spacing double-duty" for what to watch.

## Wordmark Sizing — The L Constraint

The wordmark SVGs are themselves L-shaped: a horizontal word + a rotated vertical word meeting at a corner. The design intent is for each L to snug into a page corner with the content tucked inside the L.

This means the wordmark must size **relative to the content area**, not the viewport. As the viewport shrinks, the content area shrinks *faster* than the viewport (because the sidebar and frame padding take a constant-ish slice). A `vw`-based wordmark would drift out of alignment with the content.

### Why not container queries

Ideal answer: declare `.main-content` as a CSS container and size wordmarks in `cqi` units. But wordmarks live inside `.frame`, as **siblings** of `.main-content`. Container queries can only be queried by descendants. So `cqi` against `.main-content` is unavailable without restructuring the DOM. See `backlog.md` "Content-region wrapper for cqi-based wordmark sizing" for the deferred restructure and the triggers to revisit.

### What we do instead

Derive the content-area width manually via CSS variable + `calc()`, then size wordmarks as percentages of that:

```css
--content-area-width: calc(
  100vw
  - var(--sidebar-width)
  - var(--frame-pad-right)
  - var(--frame-pad-left)
);

--wordmark-top-width: clamp(
  6.8rem,
  calc(var(--content-area-width) * 0.40),
  26rem
);

--wordmark-bottom-width: clamp(
  12rem,
  calc(var(--content-area-width) * 0.62),
  38rem
);
```

Each `clamp()` has three tunable knobs that operate in disjoint viewport ranges:

- **min** (`6.8rem` / `12rem`) sets the mobile floor.
- **coefficient** (`0.40` / `0.62`) controls fluid scaling in the laptop/tablet range.
- **max** (`26rem` / `38rem`) caps desktop size.

With the current values, the coefficient drives sizing roughly between ~430px and ~1320px viewport widths; above that the max dominates and the coefficient is inert. Tune the knob for the range you're correcting — coefficient changes are invisible at desktop sizes if the max is already capping.

### Mobile content-area recompute

When the sidebar collapses to an overlay (at `≤40rem`), it no longer takes flex space, so the usable content width widens. The CSS recomputes `--content-area-width` to drop the sidebar term whenever the page has a nav toggle:

```css
@media (max-width: 40rem) {
  body:has(.nav-toggle) {
    --content-area-width: calc(
      100vw - var(--frame-pad-right) - var(--frame-pad-left)
    );
  }
}
```

This means wordmark widths stay correctly proportional to the (now wider) content area on small viewports. The top wordmark's mobile floor (`6.8rem`) still governs at sub-tablet widths, so this recompute mostly affects the bottom wordmark's proportions. The `body:has(.nav-toggle)` scoping is intentional: pages that don't ship a toggle (e.g. a future `services.html`) keep their default sticky sidebar at mobile widths and the original `--content-area-width` math.

### Wordmark inset from the corner

```css
--frame-pad-offset-ratio: 0.15;
--wordmark-spacing: calc(var(--frame-pad-top) * var(--frame-pad-offset-ratio));
```

The L's inset from the page corner is `15%` of the frame's top padding. Lowering this hugs the wordmark to the corner inside a now-larger padding zone; raising it pushes the wordmark inward. The two knobs work together: `--space-fluid-lg` controls the *size* of the breathing room, `--frame-pad-offset-ratio` controls *where in that breathing room* the wordmark sits.

## Sidebar

```css
--sidebar-width: clamp(6rem, 14vw, 12.5rem);   /* 96px → 200px */

.sidebar {
  position: sticky;
  height: 100dvh;            /* dynamic viewport height */
  align-self: flex-start;    /* prevent flex parent from stretching */
}
```

Notes:
- `position: sticky` only works because `.frame` (the sidebar's containing block) extends through what was previously frame bottom-padding. That padding was moved to `.main-content { padding-bottom }` so the sticky container has room to scroll.
- `align-self: flex-start` prevents the sidebar from being stretched to `.main-content`'s height by flex's default `align-items: stretch`, which would kill sticky.
- `.main-content { min-width: 0 }` is required so the flex child can shrink below its intrinsic content width. Without it, long lines of unbroken text inside `.main-content` can force the flex container wider than the viewport and produce horizontal scroll. Easy to miss if it regresses.

## Mobile Nav Overlay

Below `40rem` viewport width, pages that include the `.nav-toggle` button transform the sidebar into a full-viewport overlay menu. The pattern lives entirely inside the existing `@media (max-width: 40rem)` block — no separate breakpoint, no JS for layout (only the open/close state toggle).

### Toggle button

A fixed-position `+` / `−` button rendered with two `<span>` bars and CSS transforms. Positioned to visually mirror the top wordmark:

```css
--nav-toggle-width: 4px;
--nav-toggle-position-top:  var(--wordmark-spacing);
--nav-toggle-position-left: calc(var(--wordmark-spacing) - var(--nav-toggle-width));
```

The `- var(--nav-toggle-width)` term keeps the toggle's *visual* left edge aligned with `--wordmark-spacing` rather than its bounding box. The open state is signalled by `[aria-expanded="true"]`, which hides the vertical bar so `+` becomes `−`.

### Sidebar overlay

The sidebar is rotated out of flex flow and into a fixed-position panel covering the viewport:

```css
body:has(.nav-toggle) .sidebar {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100dvh;
  /* fade controlled by opacity + visibility */
}
body.nav-open .sidebar { opacity: 1; visibility: visible; }
```

Three details worth knowing:
- All overlay rules are scoped via `body:has(.nav-toggle)` so pages without a toggle keep their default sticky sidebar at mobile widths. This makes the toggle markup the single source of truth for whether a page uses the overlay pattern.
- `visibility` flips after the opacity transition (`transition: visibility 0s linear 0.2s`) so focus order updates cleanly once the overlay is actually invisible.
- Top padding on the overlay clears the toggle button: `calc(var(--wordmark-spacing) + 2.5rem + 0.5rem)`.

### Layering

`z-index` stack inside the mobile overlay:

| Layer                              | `z-index` |
| ---------------------------------- | --------- |
| Top wordmark (when overlay is open) | 250 (raised from default `-1`) |
| Sidebar overlay                    | 200       |
| Nav toggle                         | 300       |

The top wordmark is raised above the overlay when `body.nav-open` is set so it remains visible — a deliberate design choice. The bottom wordmark is hidden under the overlay (`display: none`) since it's decorative and obscured anyway. Background page scroll is locked via `body.nav-open { overflow: hidden }`.

### Reduced motion

The overlay fade and the toggle bar transitions are disabled under `@media (prefers-reduced-motion: reduce)`. New animations added to either should be wrapped in the same guard.

## Typography Pattern

Fixed text sizes use plain `rem`:

```css
.sidebar a       { font-size: 1.125rem; }
.section-label   { font-size: 1.25rem; }
.btn             { font-size: 1rem; }
```

Display text uses the accessible fluid clamp:

```css
.intro__text,
.cta-strip__text {
  font-size: clamp(1.25rem, 1rem + 1.5vw, 2rem);
}
```

## Intentional Pixel Exceptions

Some values stay in `px` because rem-based equivalents look worse:

- `border: 2.5px solid` on `.btn` — fine pixel detail. Rendering at fractional rem (e.g., `0.15625rem`) is noise-prone.
- `--nav-toggle-width: 4px` — the toggle's bar thickness. Same rationale: a fixed-pixel detail that shouldn't drift with root font-size.

When adding a new pixel value, document why it's intentional with a comment.

## Media Queries — Minimal On Purpose

Two breakpoints, both at `40rem` (~640px):

`@media (min-width: 40rem)` adds a `padding-left: 1rem` gutter on `.main-content` so it doesn't crowd the sidebar on desktop.

`@media (max-width: 40rem)` handles three things:
- `.project-grid` becomes a single column (with `padding-right: 3rem` to clear the bottom wordmark).
- The mobile nav overlay system activates (toggle, overlay sidebar, content-area recompute, layering — see "Mobile Nav Overlay" above).
- `.hero__image-wrap` and `.footer-hero` have right-padding hooks in place but currently commented out, pending mobile design direction.

Don't add breakpoints speculatively. Add them when a specific layout decision requires one. Open mobile design questions live in `backlog.md`.

## Quick Reference: What Each Variable Controls

| Variable                      | Controls                                          | Range (min → max)                |
| ----------------------------- | ------------------------------------------------- | -------------------------------- |
| `--space-fluid-lg`            | Frame padding (top/right/bottom)                  | effectively `13vw` (see note)    |
| `--space-fluid-md`            | Frame padding (left)                              | 16px → 40px                      |
| `--space-fluid-sm`            | Content padding                                   | 10px → 20px                      |
| `--sidebar-width`             | Sidebar column width                              | 96px → 200px                     |
| `--content-area-width`        | Derived: usable width for main-content            | (computed; mobile variant drops sidebar term) |
| `--wordmark-top-width`        | Top L wordmark size                               | 108.8px → 416px                  |
| `--wordmark-bottom-width`     | Bottom L wordmark size                            | 192px → 608px                    |
| `--frame-pad-offset-ratio`    | Wordmark inset as a fraction of frame-pad-top     | `0.15`                           |
| `--wordmark-spacing`          | Offset of L corner from frame edge                | (derived: 15% of frame-pad-top)  |
| `--nav-toggle-width`          | Mobile nav toggle bar thickness                   | `4px` (intentional pixel value)  |
| `--nav-toggle-position-top`   | Vertical inset of toggle button                   | mirrors `--wordmark-spacing`     |
| `--nav-toggle-position-left`  | Horizontal inset of toggle button (visual edge)   | `--wordmark-spacing` − `--nav-toggle-width` |

## Tuning Knobs (Most Common Edits)

If the page feels too tight at desktop sizes → raise the effective value of `--space-fluid-lg` (today it resolves to `13vw`; bump that coefficient up, or restructure the clamp as noted in the Fluid Space Tokens note).

If the page shrinks too fast on mid-sized screens → lower the `vw` coefficient on the relevant token.

If the wordmark L's feel too big at **desktop sizes** → lower the **max** (`26rem` top, `38rem` bottom) inside the wordmark clamps. The coefficient does nothing above ~1320px viewport, so changing it won't help here.

If the wordmark L's drift in the **laptop/tablet range** → adjust the **coefficient** (`0.40` top, `0.62` bottom) inside the clamps.

If the wordmark L's feel too small on mobile → raise the **min** (`6.8rem` top, `12rem` bottom). The mobile content-area recompute will already have widened the basis, so the floor is the active knob below ~430px.

If the breathing room between the wordmark and the page edge feels off → raise or lower `--frame-pad-offset-ratio` (currently `0.15`). This is a pure positioning knob, independent of size. Lower = closer to the page edge; higher = pulled inward.

If the sidebar feels too wide on tablet → lower the `vw` coefficient on `--sidebar-width`.

If the mobile overlay's top padding looks wrong relative to the toggle → it's `calc(var(--wordmark-spacing) + 2.5rem + 0.5rem)`; the `2.5rem` term equals the toggle button's height.

## Testing Checklist

When changing anything in this file's purview, verify:

1. Resize the window from ~320px to ~1920px and watch the L corners stay snug.
2. Cross the `40rem` breakpoint specifically — confirm the sidebar overlay opens/closes cleanly, the toggle becomes `−`, and the bottom wordmark hides under the overlay.
3. Test with browser zoom (Ctrl-+ / Cmd-+) — typography should grow, not just the window.
4. Test with OS-level text scaling if available — same expectation.
5. On iOS Safari (real device or simulator), confirm `100dvh` doesn't cause content to be hidden behind the URL bar.
6. Watch for horizontal scroll bars appearing — usually a sign that a `vw`-based value isn't accounting for the scrollbar's width, or that `.main-content { min-width: 0 }` got removed.
7. Reduced-motion: enable `prefers-reduced-motion` and confirm the overlay transitions are suppressed.
