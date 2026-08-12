---
name: api-design
description: "This app has no REST/RPC API — its only 'contract' is the native<->script boundary (SOM passport) and the router's slot API. Conventions for both."
paths:
  - "src/**/*.cpp"
  - "res/**/*.js"
---

# API Design

There is no network API in this project. The two contracts that exist are internal: the native
host's script-visible surface, and the frontend router's slot API.

## Native <-> script boundary (SOM passport)

`MainWindow`'s `SOM_PASSPORT_BEGIN` / `SOM_PASSPORT_END` block is the entire surface the frontend
can call into on the native window object. Rules for growing it:

- Only add a member here when script genuinely needs to call into native code (file dialogs, OS
  integration, etc.) — UI-only behavior stays in `res/`.
- Keep the passport's exposed methods narrow and named for what the script needs to do, not for
  how the native side implements it.

## Router slot API (`res/shared/lib/router.js`)

The router exposes a small, consistent function set per slot (`slotNavigate`, `slotBack`,
`slotClose`, `slotIsOpen`, `slotCanGoBack`, `slotRoute`, `slotView`) plus `main`-slot shortcuts
(`navigate`, `back`, `canGoBack`, `currentRoute`, `currentRouteView`). When introducing a new named
slot (toolbar, modal, etc.):

- Reuse the existing generic `slot*` functions — don't write a parallel one-off navigation
  mechanism for the new slot.
- Only add `main`-slot-style shortcuts if the new slot is used pervasively enough to justify them;
  otherwise call the generic `slot*` functions directly with the slot name.
- Routes are defined via `route({ path, component, children })` — nest `children` for hierarchical
  views rather than encoding hierarchy into the `path` string manually.
