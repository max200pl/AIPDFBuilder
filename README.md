# sciterjs-windows

Minimal, clean Sciter.js Windows sandbox — a native-buildable counterpart to
`sciterjsMacOS`. No `.claude/` toolkit config is included on purpose: this repo
is meant as a blank target for testing the frontend-toolkit flow from scratch
(analyze-frontend, create-component, create-page, etc.) on Windows.

## Layout

```text
res/                  — Sciter JS/CSS content (loaded as "this://app/..." at runtime)
  main.htm            — window shell, currently an empty placeholder body
  shared/lib/
    router.js          — slot-based router utility (not wired up yet)
    tokens.css          — design tokens (colors, spacing, radius)
src/main.cpp           — native host (sciter::window), builds resources.cpp at pre-build
win-res/dpi-aware.manifest
sciterjs-windows.vcxproj / .sln
Directory.Build.props  — resolves the sciter-js-sdk-main checkout location
build.bat / run.bat     — build & run the compiled native host
tools/run-scapp.bat     — fast-iteration alternative: runs res/main.htm via the SDK's
                          generic scapp.exe host, no compilation needed
```

## Prerequisites

- Visual Studio 2022 (or newer) with the "Desktop development with C++" workload,
  `v143` platform toolset
- A checkout of `sciter-js-sdk-main` as a sibling under `____WORK____`
  (default expected path: `____WORK____\sciter-js-sdk-main\sciter-js-sdk-main`).
  Override via the `SCITER_SDK_ROOT` environment variable if yours lives elsewhere.

## Build & run

```bat
build.bat Debug
run.bat Debug
```

The pre-build step runs `packfolder.exe` over `res/` into `src/resources.cpp`
(gitignored, regenerated every build). The post-build step copies `sciter.dll`
next to the built exe. Debug builds load `res/main.htm` straight off disk
(live edits, no repack needed to see them — just relaunch); Release loads the
packed `this://app/main.htm` resource.

For quick iteration without compiling at all:

```bat
tools\run-scapp.bat
```
