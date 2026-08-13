// Root-wide preview shim for sciter-devtools preview/state-check/storybook — auto-loaded before
// every component render (component-creator toolkit, R2 convention: root-wide shell stubs live
// HERE, never inlined in a *.preview.js or component file).
//
// This project currently has no app-shell globals: components extend Element directly and touch
// no Localizer/kernel/format globals at construction, so there is nothing to stub yet. When a
// shared base class or dialog layout-base starts dereferencing an app-shell global in its
// constructor, add that stub here once per root.
//
// Window-modal stubs (dialog support — added with the first dialog, MessageBox). A dialog module
// is a single-export-inline Show<Name> factory (see reference-page-scaffold.md § Dialog
// file-shape) whose body mounts via Window.this.modal(vnode). Headless preview/storybook/SSIM
// renders must mount that body INLINE instead of opening a real (blocking) modal window, so the
// shim raises the __SDT_PREVIEW__ flag that dialog factories branch on.
// Surface discovered from the emitted dialog code: Window.this.modal (factory call path),
// Window.this.parameters (guarded default), Window.this.close (dismissal path — left intact when
// the harness window provides a real one; stubbed no-op only when absent).
// The flag below is the authoritative preview signal — a Window.this.modal override is NOT
// relied upon: assigning over the native method silently does not take under scapp 5.0.3.21
// (verified on the first MessageBox capture: the REAL modal opened, blocked before first paint,
// and the capture saw a 100% black unpainted frame). Dialog factories check the flag and hand
// the body vnode back for inline mount.
globalThis.__SDT_PREVIEW__ = true;
if (typeof Window !== "undefined" && Window.this) {
  try {
    if (Window.this.parameters == null) Window.this.parameters = {};
  } catch (e) { /* read-only in this engine build — bodies must null-guard parameters */ }
  try {
    if (typeof Window.this.close !== "function") Window.this.close = () => {};
  } catch (e) { /* never true under scapp; guard for DOM-less harnesses */ }
}
