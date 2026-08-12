---
name: architecture
description: "Module boundaries between the native C++ host and the Sciter.js frontend, and what's allowed to depend on what."
paths:
  - "src/**"
  - "res/**"
---

# Architecture

Two layers, one process:

```text
src/main.cpp  (native host, C++17)
   |  loads / hosts
   v
res/**        (Sciter.js frontend: HTML/CSS/JS)
```

## Boundaries

- **Native host (`src/`)** owns window lifecycle, script-runtime feature flags
  (`SciterSetOption(... SCITER_SET_SCRIPT_RUNTIME_FEATURES ...)`), and resource loading. It does
  not contain UI/business logic — that belongs in `res/`.
- **Frontend (`res/`)** owns all UI, routing (`res/shared/lib/router.js`), and design tokens
  (`res/shared/lib/tokens.css`). It talks back to the native host only through whatever SOM
  passport members `MainWindow` exposes (currently none beyond the empty passport) — don't reach
  into native internals any other way.
- **`third_party/sciter-sdk/`** is vendored and read-only. Never edit files under it; if the SDK
  needs to change, bump the vendored copy or point `SCITER_SDK_ROOT` at an external checkout —
  don't patch in place.
- **`src/resources.cpp`** is a build artifact (packed from `res/` by `packfolder.exe`) — treat it
  as generated, not source.

## Resource loading modes

`uimain()` in `src/main.cpp` resolves the UI two different ways depending on build config — don't
collapse this into one path without preserving both behaviors:

- **Debug** — loads `res/main.htm` straight off disk (via `dev_main_htm_url`), so edits are visible
  on relaunch without a rebuild.
- **Release** (and Debug as fallback) — loads the packed `this://app/main.htm` resource baked into
  `src/resources.cpp`.

## Growing the frontend

`res/shared/lib/router.js` defines a slot-based router (`registerSlot`, `slotNavigate`, etc.) but
it is not wired into `main.htm` yet. When adding real pages/components, wire them through this
router rather than introducing a second navigation mechanism.
