---
name: frontend-design-system
description: "Design tokens and typography mixins for the Sciter.js frontend — where colors/spacing/radius and type styles live and how to consume them."
paths:
  - "res/**/*.css"
  - "res/**/*.js"
---

# Frontend Design System

- **`res/shared/lib/tokens.css`** — `:root` CSS custom properties: `--color-*`, `--shadow-*`,
  `--space-{xs,sm,md,lg,xl}`, `--radius-{sm,md,popover,lg}`. Reference with `var(--name)` from
  component `.css`. Don't hardcode raw color/spacing/radius values once a token exists for it.
- **`res/shared/lib/typography.css`** — Sciter `@mixin font-{size}[-{weight}]` mixins. **The
  `font:` shorthand is broken with `var()` in Sciter — build type ONLY through these mixins,
  never from `var()` tokens.**

## Provenance

- Most of `tokens.css` (brand/surface/text/UI colors, shadows, spacing, radius) predates this
  extraction and is treated as the project's real, hand-tuned palette.
- Figma source: file `2jGq5p5qY4lsf5QK2stfOY`. This file has exactly **one page** ("Release
  Notes"), containing one template frame (node `20:311`) with a nested `Quick Action Cards`
  component instance (node `13020:18203`) — corrected from an earlier note that mischaracterized
  node `13020:18203` as a dedicated "Soda 15 Desktop" light-theme variable-set page; it is a UI
  component instance, verified directly via `get_metadata`.
- **Completeness**: this is a full pull of both subtrees on the file's only page — **19 unique
  variable bindings** (8 from node `13020:18203` + 11 from node `20:311`, no key overlap). Since
  the page has a single top-level frame and no other page/collection exists in this file, nothing
  was left un-queried *within this file*. `--space-md`/`--space-sm`/`--radius-sm` already matched
  exactly, so no duplicate tokens were added for those; `--color-bg-white` already covered the
  three variables that separately resolve to `#ffffff` (`Background/White`, `Soda White`,
  `var(--primary-background-color)`).
- **This file is very likely not the whole design system.** Variable names like `Soda Black`,
  `Soda Blue`, `Soda Green - Hover`, and `Font/Family/Soda PDF` indicate this Release Notes
  template consumes a broader "Soda PDF" brand library — one this session has no file key/URL for.
  If a dedicated design-system/component-library Figma file exists, pull it too for the fuller
  palette and type scale (more grays, semantic colors, H2–H6, additional weights); don't assume
  the 19 tokens here are the complete brand system.
- `typography.css` now has 5 mixins extracted from real text styles: `font-sm-medium` (Poppins/500
  /14dip, node `13020:18203`), `font-sm-light` (Poppins/300/14dip, "Body - Small"), `font-base-light`
  (Poppins/300/16dip, "Body - Medium"), `font-base-medium` (Poppins/500/16dip, "CTA - Medium"), and
  `font-h1` (Poppins/600/50dip, "Soda PDF/H1", outside the xs/sm/base/md/lg scale). Two Figma style
  names ("Body - Medium", "Body - Small") reference size, not weight — the actual weight kept is
  the numeric value Figma returned (Light/300), not a guess. `xs`, `lg`, `xl`, and a bold weight
  remain unresolved — extend from further Figma extraction rather than inventing values.
- **Font dependency — resolved.** Poppins was missing from the repo and the OS at the start of
  this pull; Light/Medium/SemiBold (300/500/600) TTF faces were downloaded from Google Fonts into
  `res/shared/fonts/poppins/` and wired via `@font-face` in `typography.css`. A Regular (400) and
  Bold (700) face are not yet present — add them if a mixin needs those weights.
