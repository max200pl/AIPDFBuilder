# Storybook

Visual catalog of all UI components — like web Storybook but Sciter.js native.

## Open it (3 ways)

**1. Finder click (recommended)**
Double-click `storybook.command` (macOS) or `storybook.bat` (Windows) — they live in `tools/story-book/` (the folder this file is in).

**2. Terminal**
```bash
./storybook.command          # macOS
storybook.bat                # Windows
```

**3. Full command** (if the launcher isn't set up)
```bash
PYTHONPATH=<path-to-skill>/sciter-devtools/src \
  python3 -m sciter_devtools storybook --project .
```

## What you see

```
┌─ Sidebar (280dip) ──────┬─ Detail ─────────────────────────────────────┐
│ 18 components           │ Button                                       │
│ [search…]               │ ● done · primitive · widgets · Figma ↗       │
│                         ├──────────────────────────────────────────────│
│ PRIMITIVE               │ Primary │ Secondary │ WithIcon │ …Disabled   │
│  ● AsidePanel  ◄ active │ ──────                                       │
│  ● Button               │ ┌──────────────────────────────┐             │
│  ● ButtonFeedback       │ │   <frame>                    │             │
│  ○ CaptionBar           │ │   ┌──── story render ────┐   │             │
│  ● PopoverMenu          │ │   │  <Button type=prim />│   │             │
│ FEATURE                 │ │   └──────────────────────┘   │             │
│  ○ App                  │ │                              │             │
│  ○ BackupPage           │ │                              │             │
│  …                      │ └──────────────────────────────┘             │
│ LOCAL                   │                                              │
│  ● AsidePanelItem       │                                              │
└─────────────────────────┴──────────────────────────────────────────────┘
```

- **Sidebar** — every component from `.claude/state/component-registry.json`, grouped by `type`. Dot colour: ● done · ○ unverified · ⚠ stale.
- **Search** — filters the sidebar by component name.
- **Detail header** — name + status pill + type + layer + SSIM score + Figma ↗ + JS path.
- **Story tabs** — one tab per exported story from preview.js. Single-story components hide the tab row.
- **Canvas** — isolated `<frame>` with the component's own CSS loaded.

## Adding a new story

`<name>.preview.js` uses the **CSF format** (Component Story Format — same convention as web Storybook):

```js
import { MyWidget } from "./my-widget.js";

// Each named export is a separate story (one tab in the detail panel).
// Must be PascalCase — lowercase exports are ignored by the parser.
export const Default   = () => <MyWidget />;
export const WithIcon  = () => <MyWidget icon="settings" />;
export const Disabled  = () => <MyWidget disabled={true} />;
```

Double-click `storybook.command` — the new story appears immediately.

> Export name = tab label. Compound states like `PrimaryDisabled` are a single export; `Primary` and `Disabled` would be two distinct stories.

## Behind the scenes

```
[ Double-click storybook.command ]
            │
            ▼
storybook.command (bash)
  └─ PYTHONPATH=…/sciter-devtools/src python3 -m sciter_devtools storybook --project .
            │
            ▼
sciter_devtools.storybook.build_storybook()  (Python)
  1. Read .claude/state/component-registry.json
  2. For each non-stale entry:
       a. find sibling <name>.preview.js
       b. regex `export const Name = …` → list of stories
       c. generate one wrapper .htm per story in OS tempdir:
          /var/folders/.../T/sciter-devtools-storybook/
              ├── Button.Primary.<hash>.preview.htm
              ├── Button.Secondary.<hash>.preview.htm
              └── …
       d. enriched entry: _stories[], _storyUrls{Story→file://url}
  3. Render tools/story-book/.sciter-devtools-storybook.htm (gitignored):
       const REGISTRY = [enriched entries];   ← embedded
       <App />: sidebar + story-tabs + <frame>
  4. spawn: scapp tools/story-book/.sciter-devtools-storybook.htm
            │
            ▼
scapp (Sciter desktop runtime)
  └─ opens a window, renders the JSX shell
  └─ on story-tab click:
        document.$('frame#canvas').frame.loadFile(c._storyUrls[story])
        →  wrapper.htm: `import * as stories from "file://…preview.js"`
        →  stories.Primary() — JSX node
        →  document.body.content(<…/>)
```

## File layout

| Path | What | Tracked in git? |
|------|------|----------------|
| `tools/story-book/storybook.command` / `.bat` | launcher (machine-specific paths overridable via env vars) | gitignore recommended |
| `res/widgets/*/*.preview.js` | CSF stories — **source of truth** | yes |
| `tools/story-book/.sciter-devtools-storybook.htm` | shell HTML — regenerated every run | gitignore |
| `tools/story-book/STORYBOOK.md` | this file (end-user docs) | optional |
| `<tmpdir>/sciter-devtools-storybook/*.preview.htm` | per-story wrappers in OS tempdir | n/a |
| `.claude/state/component-registry.json` | registry — drives the sidebar | yes |

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `.command` does nothing | `chmod +x storybook.command` |
| `sciter-devtools not found` | `export SCITER_DEVTOOLS_PATH=/path/to/sciter-devtools/src` |
| `cv2 ModuleNotFoundError` | `pip install -r <skill>/sciter-devtools/requirements.txt` |
| `scapp binary not found` | `export SCAPP_BIN=/path/to/scapp` or install Sciter SDK |
| Canvas stays blank | Check that preview.js uses CSF (`export const X = () => <…/>`), not the legacy `document.body.content()` side-effect form |
| Story tab doesn't switch content | Restart storybook — tempdir wrappers may be stale across edits |

Run `python -m sciter_devtools doctor` to verify the install state.
