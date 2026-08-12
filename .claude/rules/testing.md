---
name: testing
description: "No test runner is configured yet — this rule documents the current state and where tests should land once they're introduced."
paths:
  - "**/*test*"
  - "**/*.test.js"
---

# Testing

There is no test runner, test framework, or test file in this repo yet (`package.json` is a bare
placeholder with no `scripts` or `devDependencies`). Verification today is manual:

```bat
build.bat Debug
run.bat Debug
```

## When adding the first tests

- **JS/frontend logic** (e.g. `res/shared/lib/router.js`'s pure functions like `buildRouteMap`,
  `slotNavigate`) is the easiest to unit test — it has no Sciter DOM dependency. Add a test runner
  to `package.json` (`devDependencies` + a `"test"` script) before writing tests; don't hand-roll a
  runner.
- **C++ host code** (`src/main.cpp`) is thin (window setup, resource-URL resolution) — prefer
  extracting testable logic into free functions (as `dev_main_htm_url` already is) over adding a
  C++ test framework for a single-window app, unless native logic grows substantially.
- Name test files `*.test.js` / `*_test.cpp` to match this rule's `paths:` scope so this guidance
  loads automatically once tests exist.

## Do not

- Do not claim test coverage exists in commit messages or docs — there is none yet.
- Do not add a test framework dependency speculatively; add it in the same change as the first
  real test.
