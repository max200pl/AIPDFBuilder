# Icon Connection

> SEED — no icons exist under `res/` yet. This documents the Sciter js-sdk idiom for wiring an SVG
> icon into a component (source: `samples.sciter/svg-icons/test-svg-inline.htm`), so the first real
> icon follows engine convention instead of an invented one. Replace/extend once real icons land.

## Idiom: inline SVG + `styleset` selector

Sciter renders `<svg>` as a first-class element and lets CSS reach into it via `styleset`, the
same attribute components use for their root styling (see
[Styling Flow](reference-styling-flow.md)):

```html
<style>
  svg { background: gold; }       /* plain element selector, if needed */

  @set icon-close {
    rect.a { fill: var(--color-icon-default); }
  }
</style>

<svg width="24" height="24" viewBox="0 0 24 24" fill="none" styleset="#icon-close">
  <rect x="2" y="3" width="20" height="17" rx="2" stroke="#000" stroke-width="2"/>
  <rect class="a" x="5" y="10" width="14" height="7" rx="1" fill="#000"/>
</svg>
```

In a component module (per
[Component Creation Template](reference-component-creation-template.md)), the same pattern moves the
`@set` block into the component's own `.css` file and references it with `__DIR__`:

```js
// res/shared/components/IconButton/IconButton.js
export function IconButton({ name, onClick }) {
  return <svg styleset={__DIR__ + "IconButton.css#" + name} onclick={onClick} viewBox="0 0 24 24">
    {/* path data per icon */}
  </svg>;
}
```

## Color-change strategy

Icon fill/stroke colors should reference the same `--color-icon-*` tokens already defined in
`res/shared/lib/tokens.css` (`--color-icon-muted`, `--color-icon-default`) rather than hardcoded
hex values — the `@set` block's selectors target the SVG's child shapes (`rect`, `path`, `.a`,
etc.) with `fill: var(--color-icon-default)`, so a hover/active state becomes a CSS state selector
change, not a JS-driven color swap:

```css
@set icon-close {
  rect.a { fill: var(--color-icon-default); }
}
@set icon-close:hover {
  rect.a { fill: var(--color-close-hover); }
}
```

(`--color-close-hover` already exists in `tokens.css` for exactly this kind of interaction.)

## Naming

> SEED/TODO — no naming convention is established yet for icon files/ids. Proposed, unconfirmed:
> one `.svg`-sourced `@set` per icon, named `icon-<name>` to match the pattern above. Don't commit
> to this until the first 2-3 real icons reveal an actual need (e.g. multi-color icons, icon
> sprites, or a shared `Icon` wrapper component).

## Handoff

When real icons and an icon component exist, `/analyze-frontend` detects the actual
wiring/color-change strategy in use and `/update-frontend-docs` replaces this file with the
detected convention.
