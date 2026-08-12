# Styling Flow

How a new piece of UI gets styled in this project, using the design system already seeded by
`create-design-system` (`res/shared/lib/tokens.css` + `typography.css`, ruled by
[Frontend Design System](../rules/frontend-design-system.md)). This doc is the *process*; the
tokens/mixins it points at are real,
hand-authored/Figma-extracted values — not seeds themselves. The component-side `styleset`
mechanics are SEED, grounded in the js-sdk (`samples.reactor/styling/`) since no component exists
yet to confirm against.

## Step 1 — reach for a token first

Before writing any raw value (`#1a1a1a`, `16px`, `8dip`), check `res/shared/lib/tokens.css` for an
existing `--color-*`, `--space-*`, `--radius-*`, or `--shadow-*` custom property that already
covers it. The token set today:

- Colors: `--color-{brand-dark,brand-blue,brand-accent,bg,surface,surface-light,border,text,
  text-muted,text-dark,text-light,text-light-muted,primary,icon-muted,icon-default,close-hover,
  overlay-*,popover-bg,surface-accent,text-black,gray-med,bg-white,text-primary,border-light}`
- Spacing: `--space-{xs,sm,md,lg,xl}` (4/8/16/24/32 `dip`)
- Radius: `--radius-{sm,md,popover,lg}`
- Shadow: `--shadow-main`

Only add a new token if none of the above fits — don't duplicate an existing value under a new
name.

## Step 2 — apply it via `styleset`, not inline style

Component CSS references tokens with `var(--token-name)` inside a `styleset` block (external
`.css#id` file, preferred, or an inline `CSS.set` template literal for a trivial one-off) — see
[Component Creation Template](reference-component-creation-template.md) for the two forms and
their sources. Don't use inline
`style="..."` attributes for anything token-driven; `styleset` is the mechanism Sciter's Reactor
components are built around.

```css
/* res/shared/components/Card/Card.css */
@set root {
  padding: var(--space-md);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-main);
}
```

## Step 3 — typography goes through mixins, never `var()`

**Sciter's `font:` shorthand is broken when fed a `var()` token** (documented in
`typography.css`'s header comment and in
[Frontend Design System](../rules/frontend-design-system.md)'s Provenance section). Type
must be built exclusively through the `@mixin font-{size}[-{weight}]` mixins in
`res/shared/lib/typography.css`:

```css
@set root {
  @font-sm-medium; /* NOT: font: var(--something); */
}
```

Today only `font-sm-medium` (Poppins/500/14dip) exists — extend the mixin set from further Figma
extraction as more text styles are needed; don't invent a mixin for a size/weight that hasn't
actually been pulled from the design.

**Font dependency caveat**: Poppins is referenced by `font-sm-medium` but is not vendored anywhere
in the repo — it must be sourced (bundled web font or OS-level registration) before that mixin
renders as designed; until then it falls back to the `sans-serif` stack.

## Step 4 — units are always `dip`

Every size, spacing, and radius value — tokens and component-local overrides alike — uses `dip`
(device-independent pixels), matching `tokens.css` (`--space-md: 16dip`, etc.). Never mix in raw
`px` in component styles.

## Handoff

Once real components exist and reveal actual composition patterns (e.g. shared spacing scales
between components, state-variant styling), `/analyze-frontend`'s `design-system-scanner` subagent
re-derives this flow from observed usage and `/update-frontend-docs` refreshes it.
