# Frontend Architecture

> SEED where marked. The stack facts below (Sciter.js + Reactor, single root, folder layout) are
> real — read from `res/`, `jsconfig.json`, and `CLAUDE.md` — but the *conventions* for growing
> this stack (component/page boundaries, state shape) are seeded from the vendored js-sdk, not
> detected from real project code, since none exists yet.

## Stack

- **Engine**: Sciter.js (native host in `src/main.cpp`, C++17, `sciter::window`).
- **UI runtime**: Reactor — Sciter's built-in ReactJS-like implementation. Components are `Element`
  subclasses or JSX-returning functions; no external UI framework is installed or needed.
- **Module system**: ES modules (`res/main.htm` loads `<script type="module">`; `res/shared/lib/*`
  files use `export`/`import`).
- **Types**: JSDoc typedefs, checked via `jsconfig.json` (`checkJs: true`, `jsx: "react"`,
  `lib: ["es2020"]`) against `sciter.d.ts` / `sciter-extra.d.ts`.
- **Styling**: plain CSS with Sciter extensions (`dip` units, `@mixin`, `@set`/`styleset`) — no
  CSS-in-JS, no Tailwind/Uno, no CSS Modules build step. See
  [Frontend Design System](../rules/frontend-design-system.md).
- **No package.json / bundler** — Sciter loads `.js`/`.css` files directly (packed into
  `src/resources.cpp` at build time by `packfolder.exe`, or served straight off disk in Debug).

## Frontend root

Single root: `res/`. No multi-root/monorepo split — this doc is not suffixed `-<root-slug>`
because there is only one root (see the skill's Handoff note: multi-root is
`create-frontend-docs`' concern once roots multiply).

```
res/
  main.htm                    — window shell, currently a placeholder body
  shared/
    lib/
      router.js                — slot-based router utility (SlotState, RouteNode) — not wired into main.htm yet
      tokens.css                — :root design tokens (color/space/radius/shadow)
      typography.css            — @mixin font-* type-style mixins
    components/                — SEED: proposed location for future components (none exist yet)
```

## Folder boundaries

- **`res/main.htm`** — window shell only: `<head>` sets window chrome attributes
  (`window-resizable`, `window-frame`, etc.) and loads `shared/lib/tokens.css`; `<body>` is the
  mount point for the app. Don't put component logic directly in `main.htm` beyond bootstrapping
  (see the existing Ctrl+R dev-reload script as the only script currently inline there).
- **`res/shared/lib/`** — cross-cutting utilities with no UI of their own: the router, design
  tokens, typography mixins. Anything here must be usable by *any* future component/page, not
  scoped to one feature.
- **`res/shared/components/`** (SEED — doesn't exist yet) — reusable UI components, one directory
  per component per [Component Creation Template](reference-component-creation-template.md).
- A future **`res/pages/`** or **`res/views/`** directory (SEED, unresolved — see
  [Page Scaffold](reference-page-scaffold.md)) would hold route-level views once the router is
  wired up.

## Architectural boundary: native vs. frontend

Unchanged from the top-level `architecture.md` rule — restated here for frontend-doc completeness:
`res/` owns all UI/routing/tokens; it talks to the native host only through `MainWindow`'s SOM
passport (currently empty). See [Architecture](../rules/architecture.md) for the full
native/frontend contract and the Debug-vs-Release resource-loading modes.

## State management

> SEED/TODO — no state-management convention exists yet beyond what individual components hold in
> their own instance fields (Reactor's `this.componentUpdate()` / `this.state`, per
> [Component Creation Template](reference-component-creation-template.md)). If cross-component
> shared state is needed later
> (beyond what the router's slot registry already tracks), resolve it here — don't invent a global
> store convention speculatively.

## Handoff

Once real components/pages exist, `/analyze-frontend`'s `architecture-analyzer` subagent detects
the actual routing style, layout composition, and folder boundaries in use, and
`/update-frontend-docs` replaces this file in place with the detected facts.
