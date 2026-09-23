// tools/dev-bridge/page.js — page-level helpers injected into in-app specs as `page` (the
// Playwright-shaped half of the dialect). TOOLKIT-OWNED (sciter-devtools `test init`; regenerate, do
// not edit). Routing goes through ./adapter.js (the project's idiom), states through the view's
// setViewState(), geometry through element boxes, elements by Figma node id via `page.node()`.
import * as sys from "@sys";
import * as adapter from "./adapter.js";
import { elementBox, currentView, readBridgeConfig, hitTest as bridgeHitTest, describeElement } from "./DevBridge.js";
import { ExpectedElement } from "./unittest/unittest-dom.js";
import { testerror } from "./unittest/unittest-utils.js";

const nextFrame = () => new Promise((r) => requestAnimationFrame(r));
// A route is "current" for a test only once the router says so AND the view is in the DOM
// (Reactor re-renders asynchronously after navigate).
const routeShown = (route) => adapter.route() === route && !!document.$(`[data-route="${route}"]`);

async function waitUntil(pred, what, timeoutMs = 2000) {
  const deadline = Date.now() + timeoutMs;
  while (!pred()) {
    if (Date.now() > deadline) testerror`timed out after ${timeoutMs}ms waiting for ${what} (route now ${adapter.route()})`;
    await nextFrame();
  }
}

// Pointer actions synthesised IN the app (no OS mouse) — the Figma trigger vocabulary the generated
// specs use: click, hover / unhover ("while hovering"), press / release ("while pressing"), drag ("while
// dragging"), dragOver / dragLeave (the :drag-over visual), dropFiles (files dropped on the element).
// Verified in a real scapp window: handlers receive real Event objects; `:hover` / `:active` /
// `:drag-over` follow through element.state. Two engine facts shape this file — Sciter generates "click"
// ONLY for clickable elements (behavior: button | clickable | hyperlink | check | radio — <button>, <a>,
// <input> carry one by default; a plain <div> never does, for a real user OR Element.click()), so click()
// is the native click and REFUSES a non-clickable trigger instead of faking the event (a dispatched
// "click" would pass the test while the shipped app ignores the user); and the Event constructor REJECTS
// every system D&D type (drag, dragenter, drop, willacceptdrop …), so a file drop cannot be synthesised:
// dropFiles() goes through the project's `adapter.dropFiles(el, paths)` — the same seam the app's own
// `on drop` handler feeds (facade intent), or the case fails honestly.
//
// A third fact makes the verbs HIT-TEST first: Element.click() and dispatched events are delivered to the
// element even when another element covers it, while a real pointer lands on the cover. So click() /
// hover() / press() ask the engine what a pointer at the element would hit (DevBridge.hitTest →
// document.elementFromPoint, forced layout, centre then edge/corner samples) and REFUSE an occluded
// element naming the cover — the case is red for the right reason instead of a false green. `{ force: true }`
// acts on a covered element deliberately (say why in the spec). `pointer-events: none` does NOT make a
// cover transparent on this engine; a visibility:hidden element is.
//
// Every hover / press flag the verbs set is tracked and released by page.reset() — called by the runner after
// EVERY case — so one case's synthesised hover cannot paint the next case's capture.
//
// A fourth fact decides how hover() / press() reach a view's handlers (probed in a real window): a synthesised
// MOUSE-typed Event (`new Event("mousedown" | "mouseenter" | …)`) is delivered with `target === null` — the engine
// re-derives its pointer data from the real pointer — so NO delegated `at <selector>` subscription can ever match
// it (class handler or `on(type, selector, fn)`, capture or bubble, even `at *`), while the `buttons` mask IS
// honoured and BARE handlers fire: on the dispatching element, and on ancestors when no behavior consumes the type
// (a <button> consumes mousedown). Element.click() is the engine's own click and carries its target, which is why
// click() reaches delegated handlers natively. The verbs therefore dispatch the real event from the element AND
// deliver the delegated CLASS handlers of the ancestor chain themselves (`deliverDelegated`: capture ones
// outermost-in, then bubbling ones innermost-out, each with a Proxy over the native event whose `target` is the
// element and the matched descendant as the second argument) — the project's documented `["on <event> at
// <selector>"]` idiom stays reachable and a view NEVER rebinds `el.on(...)` after render to be testable. What stays
// out of reach is an engine limit a spec classes `engine-limit`: an `on(type, selector, fn)` delegated subscription
// (not introspectable) and the native event's own `target`. Locked by unittest/page-self.test.js, the first spec
// every `test run` executes.
const CLICKABLE_BEHAVIORS = /\b(button|clickable|hyperlink|check|radio|switch|label)\b/i;   // label relays the click to its control
export function behaviorOf(el) {
  let b = "";
  try { b = getComputedStyle(el)?.behavior ?? ""; } catch (_) {}
  if (!b) { try { b = el.style?.behavior ?? ""; } catch (_) {} }
  return String(b || "");
}
export function isClickable(el) {
  return ["button", "a", "input"].includes(el.tag) || CLICKABLE_BEHAVIORS.test(behaviorOf(el));
}
const describe = (el) => `<${el.tag}${el.id ? "#" + el.id : ""}${el.attributes["data-node"] ? ` data-node="${el.attributes["data-node"]}"` : ""}>`;
// ---- delegated delivery of synthesised mouse events (see the fourth engine fact above) ------------------------
const MOUSE_TYPE_RE = /^mouse/;
const HANDLER_KEY_RE = /^on\s+(\^?)([\w-]+)\s+at\s+(.+)$/;   // delegated class handlers only — bare ones fire natively
/** The delegated class handlers a component (an Element subclass instance) declares, most-derived class first. */
export function delegatedHandlers(component) {
  const out = [];
  const seen = new Set();
  let proto = null;
  try { proto = Object.getPrototypeOf(component); } catch (_) { return out; }
  for (let p = proto; p && p !== Element.prototype && p !== Object.prototype; p = Object.getPrototypeOf(p)) {
    let names = [];
    try { names = Object.getOwnPropertyNames(p); } catch (_) { break; }
    for (const key of names) {
      if (seen.has(key)) continue;                  // an override in the derived class wins
      const m = HANDLER_KEY_RE.exec(key);
      if (!m) continue;
      seen.add(key);
      const fn = p[key];
      if (typeof fn !== "function") continue;
      out.push({ capture: m[1] === "^", type: m[2], selector: m[3].trim(), fn });
    }
  }
  return out;
}
/** The event as a delegated handler expects it: the native event with `target` = the dispatching element and
 *  `currentTarget` = the component whose handler runs (the engine nulls both on a synthesised mouse event). */
function targetedEvent(evt, target, currentTarget, onStop) {
  if (typeof Proxy !== "function") return null;
  return new Proxy(evt, {
    get(t, k) {
      if (k === "target" || k === "source") return target;
      if (k === "currentTarget") return currentTarget;
      if (k === "stopPropagation" || k === "stopImmediatePropagation") return () => { onStop(); try { t[k](); } catch (_) {} };
      const v = Reflect.get(t, k);
      return typeof v === "function" ? v.bind(t) : v;
    },
  });
}
/** Deliver `evt` (already dispatched from `el`) to the delegated CLASS handlers of the ancestor chain, the way the
 *  engine would for a real pointer: capture handlers outermost-in, then bubbling handlers innermost-out; each gets
 *  (event, matchedElement) with the closest descendant between `el` and the component that matches the selector.
 *  A handler that returns true or calls stopPropagation() ends the delivery. Returns how many handlers ran. */
export function deliverDelegated(el, evt) {
  if (!MOUSE_TYPE_RE.test(String(evt.type)) || typeof Proxy !== "function") return 0;
  const chain = [];
  for (let p = el.parentElement; p; p = p.parentElement) chain.push(p);   // innermost first
  let stopped = false;
  let ran = 0;
  const deliverOn = (component, capture) => {
    for (const h of delegatedHandlers(component)) {
      if (stopped) return;
      if (h.capture !== capture || h.type !== evt.type) continue;
      let matched = null;
      for (let m = el; m && m !== component; m = m.parentElement) {
        let ok = false;
        try { ok = typeof m.matches === "function" && m.matches(h.selector); } catch (_) { ok = false; }
        if (ok) { matched = m; break; }
      }
      if (!matched) continue;
      const proxied = targetedEvent(evt, el, component, () => { stopped = true; });
      if (!proxied) return;
      ran++;
      let r;
      try { r = h.fn.call(component, proxied, matched); } catch (e) { throw e; }
      if (r === true) stopped = true;
    }
  };
  for (let i = chain.length - 1; i >= 0 && !stopped; i--) deliverOn(chain[i], true);
  for (let i = 0; i < chain.length && !stopped; i++) deliverOn(chain[i], false);
  return ran;
}
function fire(el, type, init = {}) {
  const evt = new Event(type, { bubbles: true, cancelable: true, ...init });
  el.dispatchEvent(evt);          // bare handlers on the element + bubbling ancestors, capture subscriptions, the buttons mask
  deliverDelegated(el, evt);      // the delegated class handlers the engine cannot match (target === null)
  return evt;
}
function setFlag(el, flag, on) { try { el.state[flag] = on; } catch (_) {} }
const flagOn = (el, flag) => { try { return !!el.state[flag]; } catch (_) { return false; } };

// ---- input reachability (hit-test) --------------------------------------------------------------------
/** What a pointer would hit at the element — DevBridge.hitTest with the cover described for messages. */
export function hitTest(el) {
  const r = bridgeHitTest(el);
  return { ...r, occluder: r.reachable === false && r.hit ? describeElement(r.hit) : null };
}
/** Refuse a pointer verb on an element a real pointer cannot reach — unless `{ force: true }`. */
function assertReachable(el, verb, opts) {
  if (opts && opts.force) return;
  const r = hitTest(el);
  if (!r.ok) return;                                   // no elementFromPoint on this engine — nothing to assert
  if (r.reachable) return;
  const where = r.centre ? ` at (${Math.round(r.centre.x)}, ${Math.round(r.centre.y)})` : "";
  if (r.hit && r.laidOut && /^occluded by/.test(r.reason || "")) {
    testerror`${verb}(): element ${describe(el)} is occluded by ${describeElement(r.hit)}${where} — a real pointer never reaches it (Element.click() / a dispatched event would still be delivered, so the case would be a false green). Unmount the covering element in this state or make it the blocking surface (a stamped, clickable catcher / scrim); pass { force: true } to act on a covered element deliberately.`;
  }
  testerror`${verb}(): element ${describe(el)} is not reachable — ${r.reason} (pass { force: true } to act on it anyway)`;
}

// ---- pointer flags the verbs set (hover / active / dragover) — released by page.reset() -----------------
const held = new Set();
const track = (el) => { held.add(el); };
const untrackIfClear = (el) => { if (!flagOn(el, "hover") && !flagOn(el, "active") && !flagOn(el, "dragover")) held.delete(el); };
/** Release every hover / press / drag-over the verbs synthesised; returns how many elements were released. */
export function releasePointer() {
  let n = 0;
  for (const el of Array.from(held)) {
    if (flagOn(el, "active")) { fire(el, "mouseup", { button: 0, buttons: 0 }); }
    if (flagOn(el, "hover"))  { fire(el, "mouseout"); fire(el, "mouseleave"); }
    setFlag(el, "active", false); setFlag(el, "hover", false); setFlag(el, "dragover", false);
    n++;
  }
  held.clear();
  return n;
}

export function withActions(x) {
  const el = x.element;
  const self = () => withActions(x);
  return Object.assign(x, {
    /** Native click — refused when the element is not clickable OR a real pointer could not reach it. `{ force: true }` bypasses the hit-test. */
    click(opts) {
      if (!isClickable(el)) {
        testerror`element ${describe(el)} is not clickable (behavior "${behaviorOf(el) || "none"}") — Sciter fires "click" only for behavior: button | clickable | hyperlink; a real user click would never reach its handler. The build must make the trigger a <button> or give it \`behavior: clickable\`.`;
      }
      assertReachable(el, "click", opts);
      el.click();          // posted (async) for clickable behaviors — await page.waitFor…() after it
      return self();
    },
    hover(opts)   { assertReachable(el, "hover", opts); track(el); setFlag(el, "hover", true); fire(el, "mouseenter"); fire(el, "mouseover"); fire(el, "mousemove"); return self(); },
    unhover() { fire(el, "mouseout"); fire(el, "mouseleave"); setFlag(el, "hover", false); untrackIfClear(el); return self(); },
    // Engine fact: the engine derives evt.button from the `buttons` mask (left press reads 1, right 2); the
    // `button` init field is inert — a handler sees the same evt.button for this press and a real left press.
    // Guard the context button with `evt.button === 2`, never test `button === 0` for the left button.
    press(opts)   { assertReachable(el, "press", opts); track(el); setFlag(el, "hover", true); setFlag(el, "active", true); fire(el, "mousedown", { button: 0, buttons: 1 }); return self(); },
    release() { fire(el, "mouseup", { button: 0, buttons: 0 }); setFlag(el, "active", false); untrackIfClear(el); return self(); },
    drag()    { x.press(); fire(el, "mousedragrequest"); fire(el, "mousemove", { buttons: 1 }); x.release(); return self(); },
    /** The `:drag-over` visual (a system D&D cursor over the element) — the flag only; no event can be synthesised. */
    dragOver()  { track(el); setFlag(el, "dragover", true); return self(); },
    dragLeave() { setFlag(el, "dragover", false); untrackIfClear(el); return self(); },
    /** Files dropped on the element — through the project adapter (see adapter.js `dropFiles`). */
    async dropFiles(paths) {
      const list = Array.isArray(paths) ? paths : [paths];
      if (typeof adapter.dropFiles !== "function") {
        testerror`adapter.dropFiles is not implemented — Sciter cannot synthesise system drag-and-drop events, so tools/dev-bridge/adapter.js must feed the drop to the app's own handler (${JSON.stringify(list)})`;
      }
      setFlag(el, "dragover", true);
      try { await adapter.dropFiles(el, list); } finally { setFlag(el, "dragover", false); }
      await nextFrame();
      return self();
    },
  });
}

// ---- Behaviour contracts of the primitive kinds (what a generated units/<feature>/*.unit.test.js waits on) --
// Each helper acts through the pointer verbs and waits on OBSERVABLE state — never on internals:
//   select  : click opens (state.expanded | aria-expanded="true" | a visible [role=listbox]/popup), options are
//             [role=option] | <option>, picking one closes it and changes the value (Element.value | data-value)
//   toggle  : click flips state.checked (input[type=checkbox] | <toggle> | [role=switch] | aria-checked), again flips back
//   radio   : click checks the option and unchecks the other radios of the same name / group
//   tabs    : click selects the tab ([role=tab] aria-selected="true" | state.current | state.checked), deselects the rest
//   tooltip : the host has title | tooltip text, or titleid → a [role=tooltip] with text, or hover shows [role=tooltip]
//   menu    : click opens [role=menu] | <menu> with items ([role=menuitem] | li), picking one closes it
//   input   : changeValue(text) is reflected by Element.value
// Engine facts (verified): a native <select> popup does not open under a synthesised click on this engine and
// key events cannot be synthesised — a testable select is the controlled listbox pattern; Escape is not asserted.
const visible = (el) => !!el && el.state.visible !== false;
const valueOf = (el) => (el.value !== undefined && el.value !== null && el.value !== "") ? el.value
  : (el.attributes["data-value"] ?? el.attributes["value"] ?? (el.$("[data-value]")?.attributes["data-value"]) ?? el.innerText);
const isOpen = (el) => !!el.state.expanded || el.attributes["aria-expanded"] === "true"
  || visible(el.$("[role=listbox]")) || visible(el.$("popup")) || visible(document.$(`[role=listbox][aria-labelledby="${el.id}"]`));
const optionsOf = (el) => { let o = el.$$("[role=option]"); if (!o.length) o = el.$$("option"); if (!o.length) o = document.$$("[role=listbox] [role=option]"); return o; };
const checkTarget = (el) => (el.tag === "input" || el.tag === "toggle" || el.attributes.role === "switch" || el.attributes.role === "checkbox") ? el
  : (el.$("input[type=checkbox], toggle, [role=switch], [role=checkbox], input[type=radio], [role=radio]") || el);
const checkedOf = (el) => !!el.state.checked || el.attributes["aria-checked"] === "true";
const selectedOf = (el) => el.attributes["aria-selected"] === "true" || !!el.state.current || !!el.state.checked || el.attributes["current_tab"] === "true";
const tipOf = (el, shown = false) => {
  const id = el.attributes.titleid;
  // own tooltip, or the one titleid points at; a document-wide popup counts only once hover SHOWED it
  return el.$("popup[role=tooltip], [role=tooltip]") || (id && document.$(`#${id}`))
    || (shown ? document.$$("popup[role=tooltip], [role=tooltip]").find(visible) : null) || null;
};
const menuOf = (el) => el.$("[role=menu], menu") || document.$("[role=menu]:not([hidden]), popup menu");
const describeEl = (el) => `<${el.tag}${el.id ? "#" + el.id : ""}${el.attributes["data-node"] ? ` data-node="${el.attributes["data-node"]}"` : ""}>`;

export const behaviors = {
  async select(x) {
    const el = x.element; const before = valueOf(el);
    x.click();
    await waitUntil(() => isOpen(el), `${describeEl(el)} to open (state.expanded / aria-expanded / a visible [role=listbox])`);
    const opts = optionsOf(el);
    if (!opts.length) testerror`${describeEl(el)} opened but lists no options ([role=option] | <option>)`;
    const pick = opts[Math.min(1, opts.length - 1)];
    withActions(ExpectedElement("option", pick)).click();
    await waitUntil(() => !isOpen(el), `${describeEl(el)} to close after picking '${pick.innerText}'`);
    const after = valueOf(el);
    if (opts.length > 1 && String(after) === String(before)) testerror`${describeEl(el)} value did not change after picking '${pick.innerText}' (still ${JSON.stringify(before)})`;
    return { before, after, options: opts.length };
  },
  async toggle(x) {
    const t = checkTarget(x.element); const before = checkedOf(t);
    const ctl = t === x.element ? x : withActions(ExpectedElement("toggle control", t));   // click the control, not a wrapping label
    ctl.click();
    await waitUntil(() => checkedOf(t) !== before, `${describeEl(t)} to flip (state.checked / aria-checked)`);
    ctl.click();
    await waitUntil(() => checkedOf(t) === before, `${describeEl(t)} to flip back`);
    return { before, flipped: !before };
  },
  async radio(x) {
    const t = checkTarget(x.element);
    const group = t.attributes.name ? document.$$(`input[type=radio][name="${t.attributes.name}"], [role=radio][name="${t.attributes.name}"]`) : (t.parentElement?.$$("[role=radio], input[type=radio]") ?? []);
    x.click();
    await waitUntil(() => checkedOf(t), `${describeEl(t)} to become checked`);
    const others = group.filter((g) => g !== t && checkedOf(g));
    if (others.length) testerror`${others.length} other radio(s) of the group stayed checked`;
    return { group: group.length };
  },
  async tabs(x) {
    // a single tab item stands for its list: climb to [role=tablist] / the parent
    let el = x.element;
    if (el.attributes.role === "tab" || !el.$("[role=tab]")) el = el.closest("[role=tablist]") || el.parentElement || el;
    const tabs = el.$$("[role=tab]").length ? el.$$("[role=tab]") : Array.from(el.children);
    if (tabs.length < 2) testerror`${describeEl(el)} has ${tabs.length} tab(s) ([role=tab]) — nothing to switch`;
    // a tab whose screen is not built renders DISABLED (router-controlled tab lists) — it is inert by contract,
    // so the switch is exercised on an enabled tab; when every other tab is disabled the contract under test is
    // the inert one: a click on a disabled tab must leave the selection untouched
    const disabledOf = (t) => t.state.disabled === true || t.attributes["disabled"] != null || t.attributes["aria-disabled"] === "true";
    const selected = tabs.filter(selectedOf);
    const enabled = tabs.find((t) => !selectedOf(t) && !disabledOf(t));
    if (!enabled) {
      const inert = tabs.find((t) => !selectedOf(t));
      if (!inert) testerror`${describeEl(el)}: every tab is selected — nothing to switch`;
      withActions(ExpectedElement("tab", inert)).click({ force: true });
      await nextFrame();
      if (selectedOf(inert)) testerror`disabled tab ${describeEl(inert)} took the selection — a disabled tab must be inert`;
      const lost = selected.filter((t) => !selectedOf(t));
      if (lost.length) testerror`${lost.length} selected tab(s) lost their selection when a disabled tab was clicked`;
      return { tabs: tabs.length, inert: tabs.filter(disabledOf).length, switched: false };
    }
    const target = enabled;
    withActions(ExpectedElement("tab", target)).click();
    await waitUntil(() => selectedOf(target), `the clicked tab to be selected (aria-selected / state.current)`);
    const still = tabs.filter((t) => t !== target && selectedOf(t));
    if (still.length) testerror`${still.length} other tab(s) stayed selected`;
    return { tabs: tabs.length, inert: tabs.filter(disabledOf).length, switched: true };
  },
  async tooltip(x) {
    const el = x.element;
    const text = el.attributes.title ?? el.attributes.tooltip;
    if (text && String(text).trim()) return { text, via: "attribute" };
    let tip = tipOf(el);
    if (!tip) {
      x.hover(); fire(el, "mouseidle");
      try { await waitUntil(() => !!tipOf(el, true), `${describeEl(el)} to show a [role=tooltip] (or carry title / tooltip / titleid)`, 1500); }
      finally { tip = tipOf(el, true); x.unhover(); }
    }
    const t = (tip.innerText || "").trim();
    if (!t) testerror`${describeEl(el)} tooltip has no text`;
    return { text: t, via: "role=tooltip" };
  },
  async menu(x) {
    const el = x.element;
    x.click();
    await waitUntil(() => visible(menuOf(el)), `${describeEl(el)} to open a menu ([role=menu] | <menu>)`);
    const menu = menuOf(el);
    const items = menu.$$("[role=menuitem]").length ? menu.$$("[role=menuitem]") : menu.$$("li");
    if (!items.length) testerror`${describeEl(el)} opened a menu without items ([role=menuitem] | li)`;
    withActions(ExpectedElement("menuitem", items[0])).click();
    await waitUntil(() => !visible(menuOf(el)), `the menu to close after picking '${items[0].innerText}'`);
    return { items: items.length };
  },
  /** The unit IS the menu (a popover drawn as its own component): visible, has items, picking one closes it. */
  async menuSurface(x) {
    const el = x.element;
    if (!visible(el)) testerror`${describeEl(el)} menu surface is not visible`;
    const items = el.$$("[role=menuitem]").length ? el.$$("[role=menuitem]") : el.$$("li");
    if (!items.length) testerror`${describeEl(el)} menu surface has no items ([role=menuitem] | li)`;
    withActions(ExpectedElement("menuitem", items[0])).click();
    await waitUntil(() => !el.parentElement || !visible(el), `the menu to close after picking '${items[0].innerText}'`);
    return { items: items.length };
  },
  /** The unit IS the tooltip: role=tooltip (or a popup) with text. */
  async tooltipSurface(x) {
    const el = x.element;
    const text = (el.innerText || "").trim();
    if (!text) testerror`${describeEl(el)} tooltip surface has no text`;
    if (el.attributes.role !== "tooltip" && el.tag !== "popup" && !el.$("[role=tooltip]")) testerror`${describeEl(el)} tooltip surface must carry role="tooltip" (or be a <popup>)`;
    return { text };
  },
  async input(x) {
    const el = x.element;
    const t = el.tag === "input" || el.tag === "textarea" ? el : (el.$("input, textarea, [contenteditable]") || el);
    withActions(ExpectedElement("input", t)).changeValue("probe text");
    await waitUntil(() => String(t.value) === "probe text", `${describeEl(t)} to reflect the typed value`);
    return { value: t.value };
  },
};

export const page = {
  /** Navigate the main view and wait until the route is current AND rendered. */
  async goto(route) {
    if (!adapter.routes().includes(route)) testerror`unknown route '${route}' (known: ${adapter.routes().join(", ")})`;
    adapter.navigate(route);
    await waitUntil(() => routeShown(route), `route '${route}'`);
  },
  route() { return adapter.route(); },
  routes() { return adapter.routes(); },
  async back() {
    const moved = adapter.back();
    if (moved) await waitUntil(() => routeShown(adapter.route()), `route '${adapter.route()}' after back`);
    return !!moved;
  },
  waitForRoute(route, timeoutMs) { return waitUntil(() => routeShown(route), `route '${route}'`, timeoutMs); },

  /** View state of the current routed view (data-view-state). */
  state() { return currentView(null)?.attributes["data-view-state"] ?? null; },
  async setState(state) {
    const view = currentView(null);
    if (!view) testerror`no routed view mounted`;
    if (typeof view.setViewState !== "function" || !view.setViewState(state)) {
      testerror`state '${state}' is not on the state axis of route '${adapter.route()}' (${(view.constructor?.states ?? []).join(", ")})`;
    }
    await waitUntil(() => page.state() === state, `state '${state}'`);
  },
  waitForState(state, timeoutMs) { return waitUntil(() => page.state() === state, `state '${state}'`, timeoutMs); },
  /** Data phase the current view renders (data-phase on the routed view root) — set by the mock, never by the DOM. */
  phase() { return currentView(null)?.attributes["data-phase"] ?? null; },
  waitForPhase(phase, timeoutMs) { return waitUntil(() => page.phase() === phase, `phase '${phase}'`, timeoutMs); },
  wait(ms) { return new Promise((r) => setTimeout(r, ms)); },
  behaviors,
  /** Any element by CSS selector, with the pointer actions (hover / press / drag / dropFiles …). */
  $(selector) { return withActions(ExpectedElement(selector)); },
  waitForSelector(selector, timeoutMs) { return waitUntil(() => !!document.$(selector), `element ${selector}`, timeoutMs); },

  /** Border box { x, y, w, h } in document dips. */
  box(selector) {
    const el = document.$(selector);
    if (!el) testerror`element ${selector} does not exist`;
    return elementBox(el);
  },
  /** $expect over the element stamped with a Figma design node id (data-node). An ARRAY lists the
   *  alternative copies of one trigger (a set's variants each own their children) — any match counts. */
  node(figmaNodeId) { return withActions(ExpectedElement(page.nodeSelector(figmaNodeId))); },
  nodeSelector(figmaNodeId) {
    const ids = Array.isArray(figmaNodeId) ? figmaNodeId : [figmaNodeId];
    return ids.map((id) => `[data-node="${id}"]`).join(", ");
  },
  exists(selector) { return !!document.$(selector); },
  frame: nextFrame,

  /**
   * What a pointer would hit at the element (a selector, an Element, or a `$expect` wrapper):
   * { reachable, hit (Element at the centre), occluder (its description when covered), centre, box, reachedAt, reason }.
   * The verbs call this before acting; a spec can call it to assert reachability without acting.
   */
  hitTest(target) {
    const el = typeof target === "string" ? document.$(target) : (target?.element ?? target);
    if (!el) testerror`element ${typeof target === "string" ? target : "(none)"} does not exist`;
    return hitTest(el);
  },
  /** Release every hover / press / drag-over flag the verbs synthesised (the runner calls it after every case). */
  reset() { return releasePointer(); },

  /**
   * Put the app into a data condition through the project's fixture layer (adapter.setFixture →
   * the backend mock): { role?, phase?, state?, feature? }. The role is DATA (the session's edition),
   * so specs never fake it through the DOM. A project without adapter.setFixture fails the case
   * honestly — the mock layer is part of the feature build.
   */
  async setFixture(fixture) {
    if (typeof adapter.setFixture !== "function") {
      testerror`adapter.setFixture is not implemented — tools/dev-bridge/adapter.js must route fixtures to the backend mock (${JSON.stringify(fixture)})`;
    }
    await adapter.setFixture(fixture);
    await nextFrame();
    // the view must SHOW the condition — a mock that swallows the call must not green the case
    if (fixture.role !== undefined) await waitUntil(() => page.role() === fixture.role, `the view to render role '${fixture.role}' (data-role)`);
    if (fixture.phase !== undefined) await waitUntil(() => page.phase() === fixture.phase, `the view to render phase '${fixture.phase}' (data-phase)`);
  },
  setRole(role) { return page.setFixture({ role }); },
  /** Role the current view renders for (data-role on the routed view root), or null. */
  role() { return currentView(null)?.attributes["data-role"] ?? null; },

  /**
   * Ask the runner to capture the window NOW (after two frames, so the last render is painted) and
   * compare it with the golden of the same tag when one exists. Returns the runner's record
   * { ok, tag, path, golden, ssim, tier, accepted } — or { ok: false, skipped } when no capture service
   * is configured (a run without `test run`, e.g. the dummy harness). Never throws.
   */
  async screenshot(tag) {
    const cfg = readBridgeConfig();
    if (!cfg.capturePort) return { ok: false, skipped: "no capture service (marker has no capturePort)", tag };
    await nextFrame(); await nextFrame();
    // Screen-relative box of the body plus its size in dips: whether `screen` coords come back in
    // dips or physical px differs by engine/version, so the runner scales only when the two agree.
    let body = null;
    try {
      const [x, y, w, h] = document.body.state.box("xywh", "border", "screen");
      const [dw, dh] = document.body.state.box("dimension");
      body = { x, y, w, h, dipsW: dw, dipsH: dh };
    } catch (_) {}
    const req = { tag, route: adapter.route(), state: page.state(), body, dpr: globalThis.devicePixelRatio || 1 };
    try {
      const sock = new sys.TCP();
      await sock.connect({ ip: "127.0.0.1", port: cfg.capturePort });
      sock.write(JSON.stringify(req) + "\n");
      const data = await sock.read();
      try { sock.close(); } catch (_) {}
      const bytes = new Uint8Array(data); let s = "";
      for (let i = 0; i < bytes.length; i += 4096) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 4096));
      return JSON.parse(s.trim());
    } catch (e) {
      return { ok: false, error: "capture request failed: " + (e?.message || e), tag };
    }
  },
  /**
   * Fail the test when a compared screenshot is below its tier, or when a STATE shot is not distinct from
   * its fixture's default shot — `shot.distinct` (attached by the runner for every `<fixture>.<state>` tag
   * other than the default, once the default shot exists):
   *   - `state-identical-to-default` — the frame IS the default frame (SSIM ≥ identity): the state did not render;
   *   - `state-change-off-region`   — the frame changed, but not where the state's golden differs from the
   *                                   default golden (the design's region) — drawn in the wrong place / wrong state;
   *   - `ok` / `golden-identical-to-default` (a designer question, never a red) / `pending` (the default shot
   *     comes later in the spec — the runner settles it in the summary, never here).
   * The SSIM vs the golden is compared at the GOLDEN's scale (the capture is resampled down, a golden is never
   * upscaled). A skipped / golden-less shot passes (strict mode fails it).
   */
  check(shot) {
    if (!shot) return shot;
    if (shot.ok === false && shot.error) testerror`screenshot ${shot.tag}: ${shot.error}`;
    if (shot.strict && (shot.skipped || shot.golden_missing)) testerror`screenshot ${shot.tag}: no golden to compare against (${shot.skipped || "goldens/" + shot.tag + ".png missing"}) — strict goldens`;
    if (shot.ok && shot.ssim != null && shot.ssim < shot.tier) {
      testerror`screenshot ${shot.tag}: SSIM ${shot.ssim.toFixed(3)} below tier ${shot.tier} (golden ${shot.golden})`;
    }
    const d = shot.ok ? shot.distinct : null;
    if (d && d.gating && d.verdict !== "ok") {
      const n = (v, p = 3) => (typeof v === "number" ? v.toFixed(p) : "?");
      testerror`screenshot ${shot.tag}: ${d.verdict} — SSIM vs the fixture's default shot (${d.default_tag}) ${n(d.distinct_ssim)} (identical at ≥ ${n(d.identity_ssim)}); the shot changed ${n(d.region_overlap, 2)} of the region the design changes (${n(d.region_pct, 2)}% of the frame; need ≥ ${n(d.min_overlap, 2)}); in that region SSIM ${n(d.region_ssim)} vs its own golden, ${n(d.region_ssim_default)} vs the default golden`;
    }
    return shot;
  },
};
