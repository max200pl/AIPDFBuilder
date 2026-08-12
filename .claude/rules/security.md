---
name: security
description: "The Sciter script runtime feature allowlist is this app's main security-relevant surface — keep it minimal and don't add auth/secrets handling without a real requirement."
paths:
  - "src/**/*.cpp"
---

# Security

## Script runtime feature allowlist

`uimain()` in `src/main.cpp` explicitly grants the Sciter script runtime a set of capabilities:

```cpp
SciterSetOption(NULL, SCITER_SET_SCRIPT_RUNTIME_FEATURES,
                ALLOW_FILE_IO |
                ALLOW_SOCKET_IO |
                ALLOW_EVAL |
                ALLOW_SYSINFO);
```

This is the app's real attack surface — any script running in the window inherits every flag
listed here. Rules:

- Don't add a flag (or widen an existing one) without a concrete feature that needs it.
- `ALLOW_EVAL` in particular enables arbitrary script execution from strings — if the app ever
  loads remote or user-supplied content into the window, revisit whether this flag is still
  needed.
- If a future flag is removed because a feature no longer needs it, remove it — don't leave unused
  grants "just in case."

## Debug builds

`SW_ENABLE_DEBUG` is passed unconditionally (both Debug and Release) when constructing
`MainWindow`. This opens the Sciter Inspector. Revisit before shipping a Release build to end
users — decide explicitly whether Release should keep debug tooling enabled or gate it behind the
`_DEBUG` preprocessor flag like `dev_main_htm_url` already does for dev-mode resource loading.

## Secrets

`.env` is already gitignored. No credentials, API keys, or auth flows exist in this codebase yet —
if any are added, they must never be committed, and this rule should be revisited to cover them
specifically.
