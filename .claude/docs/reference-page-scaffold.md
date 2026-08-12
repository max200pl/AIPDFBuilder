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

## Handoff

Once a real `App` shell + at least one page exist and the router is actually wired,
`/analyze-frontend`'s `architecture-analyzer` + `feature-flow-detector` subagents detect the real
routing/view conventions in use and `/update-frontend-docs` replaces this file with the detected
facts — including resolving the three SEED/TODO items above.
