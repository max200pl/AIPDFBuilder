# Page Scaffold

Routing already has a real, project-specific utility — `res/shared/lib/router.js` — so this doc
grounds page/view conventions in that API rather than reinventing one from the js-sdk. What's
seeded here is only the *missing half*: wiring it into `main.htm` and defining pages, since no
page/view or wiring exists yet (per `CLAUDE.md`: "not wired up yet").

## What exists today (real, not seed)

`res/shared/lib/router.js` implements a **slot-based** router: multiple independent named
navigation slots (`"main"`, `"toolbar"`, `"modal"`, etc.), each tracking its own current route and
back-history. Real exported API (see the file for full JSDoc):

- `route({ path, component, children })` — define a route node; `children` nests hierarchically
  rather than encoding hierarchy in the path string (per
  [API Design](../rules/api-design.md)).
- `createRouter({ routes, initial })` — build the flat `routeMap` lookup from a route tree.
- `setAppElement(el)` — register the root `Element` so `componentUpdate()` can be triggered on
  navigation.
- `registerSlot(name, router)` — register a named slot with its router config.
- Per-slot: `slotNavigate(slotName, id)`, `slotBack(slotName)`, `slotClose(slotName)`,
  `slotIsOpen(slotName)`, `slotCanGoBack(slotName)`, `slotRoute(slotName)`, `slotView(slotName)`.
- `main`-slot shortcuts: `navigate(id)`, `back()`, `canGoBack()`, `currentRoute()`,
  `currentRouteView()`.

Each route's `component` is rendered via nested JSX built from the route chain (a route with
`children` wraps its child's view via a `childView` prop) — see `buildView()` in `router.js`.

## SEED/TODO — wiring into `main.htm`

Nothing calls `createRouter`, `registerSlot`, or `setAppElement` yet, and `main.htm`'s `<body>` is
a static placeholder. The missing pieces, to resolve when the first real page is built (do not
scaffold these speculatively — this is the unresolved part the skill instructs to leave as
`SEED/TODO`, not fabricate):

1. **Where route trees are defined** — one module per feature area, or a single top-level
   `routes.js`? Unresolved.
2. **The root `App` component** — something must call `setAppElement(this)` in its constructor,
   call `createRouter(...)` + `registerSlot("main", router)` once, and render
   `currentRouteView()` in its `render()`. No such component exists yet.
3. **Navigation triggers** — `router.js` exposes `navigate()`/`slotNavigate()` as plain functions;
   nothing dispatches them from user interaction yet. The js-sdk's own routing sample
   (`samples.reactor/routing/main.htm`) demonstrates one convention worth considering — a bare
   click handler that recognizes `href="route:<name>"` links:
   ```js
   ["on click at [href^='route:']"] (event, hyperlink) {
     const routeName = hyperlink.attributes["href"].substr(6);
     return this.navigateTo(routeName); // -> would call navigate(routeName) here
   }
   ```
   This is an *option*, not a decision — `router.js`'s richer slot/children model already exceeds
   what that simpler sample needs, so adopt this trigger convention only if it fits, don't feel
   bound to it.

## Page component shape

A page/view registered as a route's `component` is an ordinary component per
[Component Creation Template](reference-component-creation-template.md) — no special base class.
If it has nested routes
(children), it should render a `childView` prop where the child route's view slots in, mirroring
`buildView()`'s nesting in `router.js`.

```js
// res/shared/pages/Home/Home.js  — SEED path, unconfirmed
export class Home extends Element {
  render() {
    return <main styleset={__DIR__ + "Home.css#root"}>
      {this.props?.childView}
    </main>;
  }
}
```

## Dialog file-shape

AUTO-GENERATED from the Sciter SDK dialog baseline (`dialog-idioms seed`, 2026-08-12) — no dialog
convention existed in this project when the first dialog (`MessageBox`) was built; review/correct
this section (and the `dialog_idioms` block in `.claude/state/frontend-analysis.json`) before
relying on it.

- **Family**: `modalWindow` (SDK baseline) — mechanism: a real modal window, not an inline
  `.modal-overlay` div.
- **File shape**: **single-export-inline** — one `Show<Name>(...)` factory is the module's export;
  the dialog body is inline JSX inside the factory (no separate `ComponentCreator` body export).
- **Placement**: `res/shared/dialogs/<Name>/<Name>.js` (+ sibling `.css`) — seeded this run with
  `MessageBox`.
- **Dismissal**: `Window.this.close([value])` from inside the dialog window.
- **Trigger idioms** (unresolved which becomes convention; first real caller decides): direct call
  (`ShowMessageBox(...)`) or a `"modal"` router slot (`registerSlot("modal", ...)` — the slot
  router already supports it).

## Page placement (resolved this run)

The first real page landed at `res/pages/<PageName>/<PageName>.js` (+ `.css`, `.preview.js`,
`.Types.d.ts` when state-aware) — resolving the `res/pages/` vs `res/views/` SEED question in
[Frontend Architecture](reference-architecture-frontend.md) in favor of `res/pages/`. The earlier
`res/shared/pages/Home/Home.js` sketch in this doc predates that decision.

## Build

> SEED — skeleton section.

| Fact | Value |
| ---- | ---- |
| prod_roots | Not observed |
| pack_tool | Not observed |
| pack_command | Not observed |
| exclusions | Not observed |
| url_scheme | Not observed |
| build_command | Not observed |
| artefact | Not observed |
| mock_switch | Not observed |

Not observed — filled by `update-frontend-docs architecture` from `frontend-analysis.json#packaging` once a build file exists in the tree.

## Events

> SEED — skeleton section.

| Event | Payload | Posted by | Consumed by | Pinned by |
| ---- | ---- | ---- | ---- | ---- |

Not observed — filled by `update-frontend-docs data-flow` from `frontend-analysis.json#data_flow` (events) once a component posts an event; every feature build appends its rows.

## Localization

> SEED — skeleton section.

Not observed — filled by `update-frontend-docs data-flow` from `frontend-analysis.json#data_flow` (localization) once a string marker or a catalog file is observed. Policy: `reference-localization.md`.

## UI tests

> SEED — skeleton section.

| Fact | Value |
| ---- | ---- |
| tests root | `tests/e2e` |
| runner | `sciter_devtools test run --project <repo>` (no launcher script in the tree) |
| click mode | Not observed |
| goldens | `tests/e2e/goldens/<route>[.<role>][.<phase>][.<state>].png` |

`tests root` and `runner` read from the tree this run; `click mode` — Not observed, filled by `update-frontend-docs` once a spec runs against the bridge.

## Dev control channel

> SEED — skeleton section.

| Fact | Value |
| ---- | ---- |
| bridge module path | Not observed |
| port | Not observed |
| marker | `.dev-bridge.json` (repo root, gitignored) |

Not observed — filled by `update-frontend-docs` (or by `sciter_devtools test init`, which installs the bridge and prints the entry-document snippet) once a bridge exists under the tree.

## Handoff

Once a real `App` shell + at least one page exist and the router is actually wired,
`/analyze-frontend`'s `architecture-analyzer` + `feature-flow-detector` subagents detect the real
routing/view conventions in use and `/update-frontend-docs` replaces this file with the detected
facts — including resolving the three SEED/TODO items above.
