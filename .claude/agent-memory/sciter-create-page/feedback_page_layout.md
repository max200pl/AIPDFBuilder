# feedback_page_layout (seed)

Page-altitude assembly/layout lessons for this project. Empty seed — append dated entries as
real page builds surface layout findings (wrapper nesting, centring containers, scroll regions).

- 2026-08-12 (Home page, dialog view-state overlay — scapp 5.0.3.21, S2-capture-proven):
  1. `position: fixed` + `width/height: 100%` collapses to a content-width stripe (percentages
     don't resolve against the window); the page flow stays intact.
  2. Edge-pinned `position: absolute` (left/top/right/bottom: 0) on a page-root child covers the
     view BUT shifts the whole page flow by the overlay child's margins — unusable at page root.
  3. `position: fixed` + EXPLICIT dip size renders the scrim correctly over an intact page — but
     children of the fixed box did not paint (the MessageBox card vnode mounted per S1 DOM marker,
     never painted). Page-level inline dialog compositing needs a calibrated recipe
     (layout-matrix has no positioned-container fixtures yet); production should use the real
     modal window path instead.

- 2026-08-12 (MessageBox dialog, first dialog build): three verified lessons.
  1. **Headless dialog preview**: overriding `Window.this.modal` in the preview shim does NOT
     take under scapp 5.0.3.21 (native method; assignment silently ignored) — the REAL modal
     opens, blocks before first paint, and the capture sees a 100% black "environment-class"
     frame (orphan scapp pid stays alive). Working pattern: the shim sets
     `globalThis.__SDT_PREVIEW__ = true` and the Show<Name> factory returns the body vnode
     inline under that flag.
  2. **Dialog-orchestrator preview runs need `--main-css res/shared/lib/tokens.css`**: without
     it the preview document has no :root custom properties (`main.css: None`) and every var()
     silently falls back (dark borders, missing composed-component backgrounds) — a harness
     invocation gap that mimics a styling defect. Build-workers pass it; a dialog branch running
     preview itself must too.
  3. **DPI normalization vs a --strip-effects reference**: the reference may be CROPPED (e.g.
     512×428 for a 430-dip card with a 0/2/0 bottom shadow). Normalize the capture with a
     UNIFORM scale to the full dip size, then CROP the shadow-crop rows — squashing the full
     capture into the cropped height introduces a progressive +1/+2px vertical misalignment
     that costs ~0.1 SSIM (0.834 → 0.929 once corrected).
