---
name: frontend-components
description: "Component structure and naming conventions for the Sciter.js Reactor frontend — SEEDED from the js-sdk idiom, not yet observed in real project code."
paths:
  - "res/**/*.js"
  - "res/**/*.css"
---

# Frontend Components

> SEED — adjust to your project's conventions. No real components exist under `res/` yet; these
> rules are grounded in the vendored Sciter js-sdk's `samples.reactor/` idioms (see
> [Component Creation Template](../docs/reference-component-creation-template.md) for the full
> recipe with sources cited). Marked seed, not detected fact — `/analyze-frontend` +
> `/update-frontend-docs` replace this file once real components exist.

## Structure

- One component per file: `res/shared/components/<ComponentName>/<ComponentName>.js` (+ a sibling
  `.css` for its `styleset`, when styled beyond inline). SEED layout — no components exist yet to
  confirm this against.
- Components are `Element` subclasses (class components, for anything with state/lifecycle) or
  plain functions returning JSX (functional components, for stateless props-in/markup-out pieces).
  See [Component Creation Template](../docs/reference-component-creation-template.md) for both
  skeletons.
- Don't introduce a second component base pattern (e.g. hooks-style, mixins) — Reactor's
  `Element`-subclass / functional-component split is what the engine natively supports.

## Naming conventions

- **Component files & classes**: `PascalCase`, file name matches class name (`Tabs.js` →
  `export class Tabs`).
- **Event handler methods**: string-literal computed keys, `["on <domEvent> [at <cssSelector>]"]`
  — e.g. `["on click at button.primary"]`. Bare `["on click"]` binds to the component root.
- **Props/state fields**: `camelCase` instance fields, assigned in the constructor from
  destructured props — no separate props/state object split beyond what `this.state` offers for
  getter/setter-mediated fields (see `Form.value` pattern in the js-sdk's `form.js`).
- **Units**: `dip` for all sizes/spacing/radius in component CSS — matches `tokens.css`'s
  `--space-*` / `--radius-*` tokens. Never raw `px` in component styles.
- **Styling hook**: every component root takes `styleset={__DIR__ + "<ComponentName>.css#<id>"}`
  (external file, preferred) or an inline `CSS.set` template tag for trivial one-offs. Never
  hardcode colors/spacing/radius that already have a token in
  `res/shared/lib/tokens.css` — see [Frontend Design System](frontend-design-system.md) and
  [Styling Flow](../docs/reference-styling-flow.md).
- **State updates**: `this.componentUpdate({ field: value })` — never mutate instance fields
  directly and expect a re-render.

## Don't

- Don't hardcode raw color/spacing/radius values once a token exists for it (enforced already by
  [Frontend Design System](frontend-design-system.md) — this rule doesn't duplicate it, just
  points at it).
- Don't build a component's `font:` shorthand from `var()` tokens — see the Sciter caveat
  documented in `res/shared/lib/typography.css` and
  [Styling Flow](../docs/reference-styling-flow.md).
