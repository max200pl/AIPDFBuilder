// tools/dev-bridge/boot.js — attach the dev bridge to a running app document.
// TOOLKIT-OWNED (sciter-devtools `test init`; regenerate, do not edit).
//
// Imported by the entry document through a guarded dynamic import that only happens when the document
// is served from disk (`file://`), so a packed build never even resolves this module — and imported
// BEFORE the app mounts, because evaluating it is the dev marker the feature facades read at their first
// use (see below):
//
//   async function boot() {
//     let bridge = null;
//     if (String(document.url()).startsWith("file://")) {
//       try { bridge = await import("../tools/dev-bridge/boot.js"); } catch (_) {}   // sets the dev marker
//     }
//     document.body.content(<App />);
//     if (bridge) bridge.attachDevBridge(document.$("#app")).catch(() => {});
//   }
//   boot();
//
// The app shell itself has no bridge code.
import { bridgeEnabled, readBridgeConfig, startDevBridge, devlog } from "./DevBridge.js";

// Dev marker: being evaluated at all from a file:// document means the app runs from the working tree
// (the runner / harness path). The marker is the HOST's switch: behind it the entry document installs each
// feature's `_debug/` mock as that feature's asset (`globalThis.<F>Asset ??= mock`, the snippet `feature
// contract` renders) before the app mounts; a facade never reads the marker — it binds the asset the host
// installed, or NO backend (the view's error phase, "backend unavailable"). A packed build never evaluates
// this file and packs no `_debug/`, so it shows fixture data only through the app's own launch switch — and
// then only when a mock was packed on purpose (a Debug build).
if (String(document.url()).startsWith("file://")) globalThis.__SDT_ALLOW_MOCK__ = true;

/**
 * Start the bridge when it is enabled (on-disk document + <repo>/.dev-bridge.json marker).
 * @param {Element} root the mounted app root (the element holding the routed view)
 * @returns {Promise<{host:string, port:number, close():void} | null>} the bridge, or null when disabled
 */
export async function attachDevBridge(root) {
  if (!bridgeEnabled()) {
    devlog(`disabled (url=${document.url()}, marker present=false)`);
    return null;
  }
  try {
    return await startDevBridge({ root, ...readBridgeConfig() });
  } catch (e) {
    devlog("failed to start: " + (e?.stack || e));
    return null;
  }
}
