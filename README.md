# AIPDFBuilder

Sciter.js Windows app, native-buildable, started as a blank sandbox ported from
`sciterjsMacOS`. No `.claude/` toolkit config is included on purpose.

Self-contained: the Sciter SDK pieces needed to build (headers, `packfolder.exe`,
`sciter.dll`) are vendored under `third_party/sciter-sdk/` — no external SDK
checkout required to build the exe.

**Single-file distribution:** the built exe is the only file colleagues need.
`sciter.dll` is embedded inside it as a resource (`win-res/app.rc`) and
unpacked to `%LOCALAPPDATA%\AIPDFBuilder\sciter.dll` on first run — see
`preload_sciter_dll()` in `src/main.cpp`. No `sciter.dll` ships alongside the
exe anymore, and no Visual C++ Redistributable is needed either (the CRT is
statically linked).

## Layout

```text
res/                  — Sciter JS/CSS content (loaded as "this://app/..." at runtime)
  main.htm            — window shell, currently an empty placeholder body
  shared/lib/
    router.js          — slot-based router utility (not wired up yet)
    tokens.css          — design tokens (colors, spacing, radius)
src/main.cpp           — native host (sciter::window) + preload_sciter_dll()
                          (unpacks the embedded sciter.dll before the SDK's
                          own hardcoded LoadLibrary(L"sciter.dll") runs) +
                          a custom wmain (SKIP_MAIN) so that preload happens
                          before sciter::application::start()
win-res/dpi-aware.manifest
win-res/app.rc          — embeds third_party/sciter-sdk's sciter.dll as RCDATA
third_party/sciter-sdk — vendored: include/, bin/windows/packfolder.exe,
                          bin/windows/x64/sciter.dll, LICENSE, EULA
AIPDFBuilder.vcxproj / .sln
Directory.Build.props  — resolves which Sciter SDK to build against
builds/<Config>/       — build output (exe only), gitignored
build.bat / run.bat     — build & run the compiled native host
tools/run-scapp.bat     — fast-iteration alternative: runs res/main.htm via a
                          generic scapp.exe host (needs a separate full SDK
                          checkout — scapp.exe itself isn't vendored)
```

## Prerequisites

- Visual Studio 2022 (or newer) with the "Desktop development with C++" workload,
  `v143` platform toolset

That's it — the build is self-contained.

To build against a different/newer SDK instead of the vendored one, set the
`SCITER_SDK_ROOT` environment variable to another SDK checkout root.

## Build & run

```bat
build.bat Debug
run.bat Debug
```

The pre-build step runs `packfolder.exe` over `res/` into `src/resources.cpp`
(gitignored, regenerated every build). Debug builds load `res/main.htm`
straight off disk (live edits, no repack needed to see them — just relaunch);
Release loads the packed `this://app/main.htm` resource.

To hand off to a colleague: copy `builds/Release/AIPDFBuilder.exe` — just that
one file. Verified by running it from a completely empty folder.

For quick iteration without compiling at all (requires a separate sciter-js-sdk
checkout with `scapp.exe`, e.g. as a sibling under `SCITER_SDK_ROOT`):

```bat
tools\run-scapp.bat
```
