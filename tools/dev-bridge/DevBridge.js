// tools/dev-bridge/DevBridge.js — development-only control channel into the running Sciter app.
// TOOLKIT-OWNED (sciter-devtools `test init` writes it; regenerate, do not edit). Project-specific
// knowledge lives in ./adapter.js (routing idiom, repo root) — this file is identical in every project.
//
// Lives OUTSIDE res/ on purpose: a packed (Release) build never carries it, and the app shell does
// not know it exists — the entry document attaches it through ./boot.js only when it runs from disk.
//
// A loopback TCP server (newline-delimited JSON) that lets tooling (tests, an MCP server) drive the
// app the way a user would end up: switch routes, set a view's state, read what is shown, run a JS
// spec inside the window. It sits ON TOP of the project's router (adapter.navigate/back/route/routes)
// and the view-state convention (`data-route` / `data-view-state` + `setViewState()` on the view).
//
// Enabled ONLY when both hold:
//   1. the document is served from disk (`file://`), never from a packed `this://app/` resource;
//   2. a marker file `<repo-root>/.dev-bridge.json` exists (gitignored; `{ "port": 7331 }`).
// Protocol (sciter-dev-bridge/1.0): one JSON object per line in, one per line out
// ({ ok: true, ... } | { ok: false, error }). Commands: ping · getRoute · listRoutes ·
// navigate {route} · back · listStates · getState · setState {viewState} · setFixture {role?, phase?, …} ·
// query {selector, attrs?} (+ hit / reachable: the top-most element at the match's centre) ·
// hitTest {selector} · click {selector, force?} · box {selector} ·
// waitFor {route?, viewState?, selector?, timeoutMs?} · runSpec {path} · protocol.
//
// Hit-testing (input reachability). Element.click() and dispatched events are delivered to the element
// itself even when another element covers it — a real pointer never gets there. `hitTest(el)` asks the
// engine what a pointer at the element's centre would hit (document.elementFromPoint) and, when the
// centre is covered, samples the element's edges and corners too (a scrim or a click-catcher is MEANT to
// be covered in the middle by the surface it backs). Engine facts (verified): `pointer-events: none` is
// parsed but does NOT make a covering layer transparent to the hit-test; a `visibility: hidden` element
// is transparent; boxes read before the pending layout are zeros — Window.update() forces the layout.
//
// No in-place `reload` command on purpose: `Window.this.load(document.url())` issued from a
// socket-driven realm leaves the NEW realm frozen on this engine. Reloading is a PROCESS restart,
// owned by the runner.
import * as sys from "@sys";
import * as adapter from "./adapter.js";

export const PROTOCOL = "sciter-dev-bridge/1.0";
export const DEFAULT_PORT = 7331;
export const COMMANDS = ["ping", "getRoute", "listRoutes", "navigate", "back", "listStates", "getState", "setState",
                         "setFixture", "query", "hitTest", "click", "box", "waitFor", "runSpec", "protocol"];
const MARKER_URL = adapter.repoRootUrl + ".dev-bridge.json";
const LOG_URL = adapter.repoRootUrl + ".dev-bridge.log";

/** Dev-only trace: scapp does not surface console.log, so append to <repo>/.dev-bridge.log. */
export function devlog(msg) {
  const line = `${new Date().toISOString()} ${msg}\n`;
  try { const f = sys.fs.$open(URL.toPath(LOG_URL), "a", 0o666); f.$write(line); f.$close(); } catch (_) {}
  console.log("[DevBridge] " + msg);
}

function bytesToString(buf) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 4096) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 4096));
  return s; // commands are ASCII JSON; non-ASCII payloads are escaped by JSON.stringify on the client
}

/** True when the bridge may run: on-disk document + marker file present. */
export function bridgeEnabled() {
  if (!String(document.url()).startsWith("file://")) return false;
  try { sys.fs.statSync(URL.toPath(MARKER_URL)); return true; } catch (_) { return false; }
}

/** Marker-file config merged over defaults. */
export function readBridgeConfig() {
  const cfg = { host: "127.0.0.1", port: DEFAULT_PORT };
  try { Object.assign(cfg, JSON.parse(bytesToString(sys.fs.$readfile(URL.toPath(MARKER_URL))))); } catch (_) {}
  return cfg;
}

const nextFrame = () => new Promise((r) => requestAnimationFrame(r));
let specRunner = null;

/** Border box of an element in document dips: { x, y, w, h }. */
export function elementBox(el) {
  try {
    const [x, y, w, h] = el.state.box("xywh", "border", "document");
    return { x, y, w, h };
  } catch (_) {
    const [w, h] = el.state.box("dimension");
    return { x: null, y: null, w, h };
  }
}

// ---- hit-testing (input reachability) ----------------------------------------------------------------
/** Force the pending layout so element boxes are real (zeros before the first layout of a fresh render). */
export function forceLayout() { try { Window.this.update(); } catch (_) {} }

/** Border box in DOCUMENT dips — the coordinate space `document.elementFromPoint` reads: { x, y, w, h } | null.
 *  Never use the "window" relation here: on this engine it is expressed in device PIXELS (a 100dip box reads
 *  125 at 125 % DPI), so a centre taken from it lands outside the document and every element looks occluded. */
export function pointerBox(el) {
  try { const [x, y, w, h] = el.state.box("xywh", "border", "document"); return { x, y, w, h }; } catch (_) { return null; }
}

/** `<div#home-layer.home__layer data-node="…">` — how a cover / hit is named in every message. */
export function describeElement(el) {
  if (!el) return "<nothing>";
  let s = "<" + el.tag;
  if (el.id) s += "#" + el.id;
  const cls = String(el.attributes["class"] ?? "").trim().split(/\s+/).filter(Boolean);
  if (cls.length) s += "." + cls.join(".");
  const node = el.attributes["data-node"];
  if (node) s += ` data-node="${node}"`;
  return s + ">";
}

/** JSON-safe descriptor of an element (what `query` / `hitTest` return as `hit`). */
export function hitDescriptor(el) {
  if (!el) return null;
  let behavior = "";
  try { behavior = getComputedStyle(el)?.behavior || el.style?.behavior || ""; } catch (_) {}
  const clickable = ["button", "a", "input"].includes(el.tag) || /\b(button|clickable|hyperlink|check|radio|switch|label)\b/i.test(String(behavior));
  // The overlay layer the hit belongs to: its nearest position:fixed ancestor (or itself) and the stamped
  // triggers that layer holds — a cover that shares a layer with the variant's own scrim / catcher is the
  // dialog or menu surface itself (the overlay pattern), not a stray element.
  let layer = null;
  for (let p = el; p; p = p.parentElement) {
    let pos = "";
    try { pos = String(getComputedStyle(p)?.position ?? ""); } catch (_) {}
    if (pos === "fixed") { layer = p; break; }
  }
  const layerTriggers = layer ? Array.from(layer.$$("[data-node]"), (n) => n.attributes["data-node"]).filter(Boolean) : [];
  return { tag: el.tag, id: el.id || null, class: el.attributes["class"] ?? null, node: el.attributes["data-node"] ?? null,
           clickable, desc: describeElement(el), layer: layer ? describeElement(layer) : null, layerTriggers };
}

const isSelfOrDescendant = (el, hit) => {
  if (!hit) return false;
  if (hit === el) return true;
  try { if (typeof el.contains === "function") return !!el.contains(hit); } catch (_) {}
  for (let p = hit.parentElement; p; p = p.parentElement) if (p === el) return true;
  return false;
};

/**
 * What a pointer would hit at the element: the top-most element at its centre (document.elementFromPoint,
 * document dips), then — when the centre is covered — at inset corners and edge midpoints, so a
 * surface meant to be covered in the middle (scrim, click-catcher behind a menu) still counts as reachable.
 * @returns {{ ok: boolean, laidOut: boolean, reachable: boolean | null, hit: Element | null, centre: {x,y} | null,
 *            box: object | null, reachedAt: {x,y} | null, samples: number, reason: string | null }}
 *   `hit` is the element found at the CENTRE (the cover when not reachable); `reason` explains a false.
 */
export function hitTest(el) {
  forceLayout();
  let box = pointerBox(el);
  if (!box || (!box.w && !box.h)) { forceLayout(); box = pointerBox(el); }
  const out = { ok: true, laidOut: true, reachable: false, hit: null, centre: null, box, reachedAt: null, samples: 0, reason: null };
  if (!box || (!box.w && !box.h)) {
    return { ...out, laidOut: false, reason: "no layout box (not rendered / display:none) — a pointer cannot reach it" };
  }
  let vis = "";
  try { vis = String(getComputedStyle(el)?.visibility ?? ""); } catch (_) {}
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  out.centre = { x: cx, y: cy };
  // document.elementFromPoint and state.box(…, "document") share one coordinate space (document dips) — no
  // origin correction; a "window"-relation box would be in device pixels (see pointerBox).
  const probe = (x, y) => document.elementFromPoint(x, y);
  try { out.hit = probe(cx, cy); } catch (e) {
    return { ...out, ok: false, reachable: null, reason: "document.elementFromPoint unavailable on this engine: " + (e?.message || e) };
  }
  out.samples = 1;
  if (isSelfOrDescendant(el, out.hit)) { out.reachable = true; out.reachedAt = out.centre; return out; }
  if (vis === "hidden" || vis === "collapse") return { ...out, reason: `not visible (visibility: ${vis}) — a pointer passes through it` };
  const dx = Math.min(4, box.w / 4), dy = Math.min(4, box.h / 4);
  const points = [[box.x + dx, box.y + dy], [box.x + box.w - dx, box.y + dy], [box.x + dx, box.y + box.h - dy], [box.x + box.w - dx, box.y + box.h - dy],
                  [cx, box.y + dy], [cx, box.y + box.h - dy], [box.x + dx, cy], [box.x + box.w - dx, cy]];
  for (const [x, y] of points) {
    out.samples++;
    let h = null;
    try { h = probe(x, y); } catch (_) { break; }
    if (isSelfOrDescendant(el, h)) { out.reachable = true; out.reachedAt = { x, y }; return out; }
  }
  out.reason = out.hit ? `occluded by ${describeElement(out.hit)} at (${Math.round(cx)}, ${Math.round(cy)}) — and at ${out.samples - 1} edge/corner sample point(s)`
                       : `nothing at (${Math.round(cx)}, ${Math.round(cy)}) — outside the document or clipped away`;
  return out;
}

/** The current routed view element (the node carrying data-route). */
export function currentView(root) {
  if (typeof adapter.view === "function") { const v = adapter.view(); if (v) return v; }
  return root?.$("[data-route]") ?? document.$("[data-route]");
}

const viewState = (root) => currentView(root)?.attributes["data-view-state"] ?? null;

/**
 * Execute one command against the app. Pure with respect to the transport — a spec can drive it
 * directly, the TCP server just frames it.
 * @param {{cmd: string, [k: string]: any}} msg
 * @param {{root: Element}} ctx
 */
export async function handleCommand(msg, ctx) {
  const root = ctx?.root ?? null;
  const cmd = msg?.cmd;
  switch (cmd) {
    case "protocol":
      return { ok: true, protocol: PROTOCOL, commands: COMMANDS };

    case "ping":
      return { ok: true, pong: true, protocol: PROTOCOL, route: adapter.route() };

    case "getRoute":
      return { ok: true, route: adapter.route(), chain: typeof adapter.chain === "function" ? adapter.chain() : [] };

    case "listRoutes":
      return { ok: true, routes: adapter.routes() };

    case "navigate": {
      const target = String(msg.route ?? "");
      if (!adapter.routes().includes(target)) return { ok: false, error: `unknown route '${target}'`, routes: adapter.routes() };
      adapter.navigate(target);
      await nextFrame();
      return { ok: adapter.route() === target, route: adapter.route() };
    }

    case "back": {
      const moved = adapter.back();
      await nextFrame();
      return { ok: !!moved, route: adapter.route() };
    }

    case "listStates": {
      const view = currentView(root);
      const states = view?.constructor?.states ?? [];
      return { ok: true, route: adapter.route(), states, current: viewState(root) };
    }

    case "getState": {
      const view = currentView(root);
      if (!view) return { ok: false, error: "no routed view mounted" };
      return { ok: true, route: adapter.route(), viewState: viewState(root) };
    }

    case "setState": {
      const view = currentView(root);
      if (!view) return { ok: false, error: "no routed view mounted" };
      if (typeof view.setViewState !== "function") return { ok: false, error: "view has no setViewState()" };
      const requested = String(msg.viewState ?? "");
      if (!view.setViewState(requested)) {
        return { ok: false, error: `state '${requested}' is not on the view's state axis`, states: view.constructor?.states ?? [] };
      }
      await nextFrame();
      const effective = viewState(root);
      return { ok: effective === requested, viewState: effective, requested };
    }

    case "setFixture": {
      // Data condition via the project's fixture layer (adapter.setFixture → backend mock):
      // { role?, phase?, state?, feature? }. Role/phase are DATA, never DOM tweaks.
      if (typeof adapter.setFixture !== "function") {
        return { ok: false, error: "adapter.setFixture is not implemented — see tools/dev-bridge/adapter.js" };
      }
      const fixture = { ...msg }; delete fixture.cmd;
      await adapter.setFixture(fixture);
      await nextFrame();
      return { ok: true, route: adapter.route(), viewState: viewState(root),
               role: currentView(root)?.attributes["data-role"] ?? null,
               phase: currentView(root)?.attributes["data-phase"] ?? null };
    }

    // ---- DOM-level commands ---------------------------------------------------------------------
    case "query": {
      const els = document.$$(String(msg.selector ?? ""));
      // Alternatives (a set's variants each own a copy of one trigger): the copy a pointer can reach is the
      // one described; with none reachable, the first match and the cover over it.
      const probes = els.slice(0, 8).map((el) => ({ el, ...hitTest(el) }));
      const best = probes.find((p) => p.reachable) ?? probes[0] ?? null;
      const first = best?.el ?? null;
      // Element.attributes is not reliably enumerable on this engine — read a known set plus any the
      // caller names in `attrs` (missing attributes come back as null).
      const names = ["id", "class", "data-route", "data-view-state", "data-node", "data-placeholder", ...(msg.attrs ?? [])];
      const attrs = {};
      if (first) for (const name of names) attrs[name] = first.attributes[name] ?? null;
      let behavior = null, clickable = null;
      if (first) {
        try { behavior = getComputedStyle(first)?.behavior || first.style?.behavior || ""; } catch (_) { behavior = ""; }
        // Sciter fires "click" only for these — a plain <div> trigger is invisible to a real user click
        clickable = ["button", "a", "input"].includes(first.tag) || /\b(button|clickable|hyperlink|check|radio|switch|label)\b/i.test(String(behavior));
      }
      // the :disabled STATE flag (Reactor's `state-disabled={…}` sets the flag, not an attribute) — a disabled
      // control is inert for a real pointer, so the doctor must not read it as a live affordance
      let disabled = null;
      if (first) { try { disabled = first.state.disabled === true || first.attributes["disabled"] != null || first.attributes["aria-disabled"] === "true"; } catch (_) { disabled = null; } }
      return { ok: true, count: els.length, exists: els.length > 0, tag: first?.tag ?? null, id: first?.id ?? null,
               text: first ? first.innerText : null, attributes: first ? attrs : null, behavior, clickable, disabled,
               // reachability: the top-most element at the match's centre, and whether a pointer reaches the match at all
               reachable: best ? (best.ok ? best.reachable : null) : null, laidOut: best ? best.laidOut : null,
               hit: best ? hitDescriptor(best.hit) : null, centre: best?.centre ?? null, reachedAt: best?.reachedAt ?? null,
               reason: best?.reason ?? null };
    }

    case "hitTest": {
      const el = document.$(String(msg.selector ?? ""));
      if (!el) return { ok: false, error: `no element matches '${msg.selector}'`, exists: false };
      const r = hitTest(el);
      return { ok: true, exists: true, reachable: r.ok ? r.reachable : null, laidOut: r.laidOut, hit: hitDescriptor(r.hit),
               centre: r.centre, box: r.box, reachedAt: r.reachedAt, samples: r.samples, reason: r.reason, element: hitDescriptor(el) };
    }

    case "click": {
      const el = document.$(String(msg.selector ?? ""));
      if (!el) return { ok: false, error: `no element matches '${msg.selector}'` };
      // a real pointer must reach the element — Element.click() alone would be delivered under any cover
      const r = hitTest(el);
      if (r.ok && !r.reachable && !msg.force) {
        return { ok: false, error: `${describeElement(el)} is not reachable: ${r.reason} (pass force: true to click it anyway)`,
                 hit: hitDescriptor(r.hit), centre: r.centre, reachable: false };
      }
      el.click();
      await nextFrame();
      return { ok: true, route: adapter.route(), viewState: viewState(root), reachable: r.ok ? r.reachable : null, forced: !!msg.force && r.ok && !r.reachable };
    }

    case "box": {
      const el = document.$(String(msg.selector ?? ""));
      if (!el) return { ok: false, error: `no element matches '${msg.selector}'` };
      return { ok: true, ...elementBox(el) };
    }

    case "waitFor": {
      const timeout = Number(msg.timeoutMs ?? 2000);
      const deadline = Date.now() + timeout;
      const check = () => {
        if (msg.route != null && !(adapter.route() === msg.route && document.$(`[data-route="${msg.route}"]`))) return false;
        if (msg.viewState != null && viewState(root) !== msg.viewState) return false;
        if (msg.selector != null && !document.$(String(msg.selector))) return false;
        return true;
      };
      while (!check()) {
        if (Date.now() > deadline) {
          return { ok: false, error: `waitFor timed out after ${timeout}ms`, route: adapter.route(), viewState: viewState(root) };
        }
        await nextFrame();
      }
      return { ok: true, route: adapter.route(), viewState: viewState(root) };
    }

    // ---- in-app spec execution (the JS test dialect) ------------------------------------------------
    case "runSpec": {
      // Loaded lazily by RELATIVE path (a native-path dynamic import fails on Windows scapp).
      if (!specRunner) specRunner = await import("./spec-runner.js");
      // isolation: a spec must not inherit the fixture / state the previous file left behind
      if (typeof adapter.reset === "function") { try { await adapter.reset(); await nextFrame(); } catch (e) { return { ok: false, error: "adapter.reset failed: " + (e?.message || e) }; } }
      return specRunner.runSpec(String(msg.path ?? ""), { root });
    }

    default:
      return { ok: false, error: `unknown command '${cmd}'`, commands: COMMANDS };
  }
}

async function serveConnection(conn, ctx) {
  let pending = "";
  for (;;) {
    let data;
    try { data = await conn.read(); } catch (e) { devlog("read failed: " + e); break; }
    if (!data) break;
    pending += bytesToString(data);
    let nl;
    while ((nl = pending.indexOf("\n")) >= 0) {
      const line = pending.slice(0, nl).trim();
      pending = pending.slice(nl + 1);
      if (!line) continue;
      let reply;
      try {
        reply = await handleCommand(JSON.parse(line), ctx);
      } catch (e) {
        reply = { ok: false, error: String(e?.message || e) };
      }
      devlog(`cmd ${line.slice(0, 80)} -> ${JSON.stringify(reply).slice(0, 120)}`);
      try { conn.write(JSON.stringify(reply) + "\n"); } catch (e) { devlog("write failed: " + e); return; }
    }
  }
  try { conn.close(); } catch (_) {}
}

/**
 * Start the loopback server. Resolves once listening; the accept loop runs in the background.
 * @param {{root: Element, host?: string, port?: number}} opts
 * @returns {Promise<{host: string, port: number, close(): void}>}
 */
export async function startDevBridge(opts) {
  const host = opts?.host ?? "127.0.0.1";
  const port = opts?.port ?? DEFAULT_PORT;
  devlog(`starting on ${host}:${port} (document ${document.url()})`);
  const server = new sys.TCP();
  try {
    server.bind({ ip: host, port });
    server.listen();
  } catch (e) {
    devlog("bind/listen failed: " + e);
    throw e;
  }
  let open = true;
  const bridge = {
    host, port,
    close() {
      if (!open) return;
      open = false;
      try { server.close(); } catch (_) {}
      devlog(`closed ${host}:${port}`);
    },
  };
  const ctx = { root: opts?.root ?? null, bridge };
  (async () => {
    while (open) {
      let conn;
      try { conn = await server.accept(); } catch (e) { if (open) devlog("accept failed: " + e); break; }
      if (conn) serveConnection(conn, ctx);
    }
  })();
  // Document teardown (reload, window close) frees the port.
  document.on("beforeunload", () => bridge.close());
  devlog(`listening on ${host}:${port}`);
  try { Window.this.caption = `${Window.this.caption} [dev bridge :${port}]`; } catch (_) {}
  return bridge;
}
