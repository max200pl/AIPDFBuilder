/**
 * @typedef {typeof Element} ComponentClass
 */

/**
 * @typedef {Object} RouteNode
 * @property {string} path — segment name ("scan", "results")
 * @property {ComponentClass} component
 * @property {RouteNode[]} [children]
 */

/**
 * @typedef {Object} SlotState
 * @property {Record<string, RouteNode[]>} routeMap
 * @property {string | null} current
 * @property {string[]} history
 */

// =============================================================
// Route builder
// =============================================================

/**
 * Define a route with optional children.
 * @param {{ path: string, component: ComponentClass, children?: RouteNode[] }} opts
 * @returns {RouteNode}
 */
export function route(opts) {
  return {
    path: opts.path,
    component: opts.component,
    children: opts.children || [],
  };
}

/**
 * Build flat lookup: fullPath → chain of RouteNodes.
 * @param {RouteNode[]} routes
 * @param {string} [prefix]
 * @returns {Record<string, RouteNode[]>}
 */
function buildRouteMap(routes, prefix = "") {
  /** @type {Record<string, RouteNode[]>} */
  const map = {};
  for (const r of routes) {
    const fullPath = prefix ? prefix + "/" + r.path : r.path;
    map[fullPath] = [...(prefix ? map[prefix] || [] : []), r];
    if (r.children && r.children.length > 0) {
      Object.assign(map, buildRouteMap(r.children, fullPath));
    }
  }
  return map;
}

/**
 * Build nested JSX from route chain.
 * @param {RouteNode[]} chain
 * @returns {any}
 */
function buildView(chain) {
  let view = null;
  for (let i = chain.length - 1; i >= 0; i--) {
    const Page = chain[i].component;
    view = <Page childView={view} />;
  }
  return view;
}

/**
 * Create router config from route definitions.
 * @param {{ routes: RouteNode[], initial?: string }} opts
 */
export function createRouter({ routes, initial }) {
  const routeMap = buildRouteMap(routes);
  const initialRoute = initial || (routes.length > 0 ? routes[0].path : "");
  return { routes, routeMap, initialRoute };
}

// =============================================================
// Slot registry
// =============================================================

/** @type {Record<string, SlotState>} */
const _slots = {};

/** @type {Element | null} */
let _appElement = null;

/** Trigger App re-render. */
function update() {
  if (_appElement) _appElement.componentUpdate();
}

/**
 * Register the App element for componentUpdate().
 * @param {Element} el
 */
export function setAppElement(el) {
  _appElement = el;
}

/**
 * Register a named route slot.
 * @param {string} name — slot name ("main", "toolbar", "modal", etc.)
 * @param {{ routeMap: Record<string, RouteNode[]>, initialRoute: string }} router
 */
export function registerSlot(name, router) {
  _slots[name] = {
    routeMap: router.routeMap,
    current: router.initialRoute || null,
    history: [],
  };
}

// =============================================================
// Generic slot API
// =============================================================

/**
 * Navigate a slot to a route.
 * @param {string} slotName
 * @param {string} id — full route path
 */
export function slotNavigate(slotName, id) {
  const slot = _slots[slotName];
  if (!slot || id === slot.current) return;
  if (!slot.routeMap[id]) return;
  if (slot.current) {
    slot.history.push(slot.current);
    if (slot.history.length > 50) slot.history.shift();
  }
  slot.current = id;
  update();
}

/**
 * Go back in a slot. Returns false if no history.
 * @param {string} slotName
 * @returns {boolean}
 */
export function slotBack(slotName) {
  const slot = _slots[slotName];
  if (!slot || slot.history.length === 0) return false;
  slot.current = slot.history.pop();
  update();
  return true;
}

/**
 * Close a slot — set current to null, clear history.
 * @param {string} slotName
 */
export function slotClose(slotName) {
  const slot = _slots[slotName];
  if (!slot) return;
  slot.current = null;
  slot.history = [];
  update();
}

/**
 * Is a slot currently active (has a route)?
 * @param {string} slotName
 * @returns {boolean}
 */
export function slotIsOpen(slotName) {
  const slot = _slots[slotName];
  return slot ? slot.current !== null : false;
}

/**
 * Can go back in a slot?
 * @param {string} slotName
 * @returns {boolean}
 */
export function slotCanGoBack(slotName) {
  const slot = _slots[slotName];
  return slot ? slot.history.length > 0 : false;
}

/**
 * Get current route path of a slot.
 * @param {string} slotName
 * @returns {string | null}
 */
export function slotRoute(slotName) {
  const slot = _slots[slotName];
  return slot ? slot.current : null;
}

/**
 * Get root segment of a slot's current route. "scan/results" → "scan"
 * @param {string} slotName
 * @returns {string | null}
 */
export function slotRootRoute(slotName) {
  const route = slotRoute(slotName);
  if (!route) return null;
  const idx = route.indexOf("/");
  return idx === -1 ? route : route.substring(0, idx);
}

/**
 * Build nested JSX for a slot's current route.
 * @param {string} slotName
 * @returns {any} JSX vnode or null
 */
export function slotView(slotName) {
  const slot = _slots[slotName];
  if (!slot || !slot.current || !slot.routeMap[slot.current]) return null;
  return buildView(slot.routeMap[slot.current]);
}

// =============================================================
// Convenience: "main" slot shortcuts
// =============================================================

/** @param {string} id */
export function navigate(id) { slotNavigate("main", id); }

/** @returns {boolean} */
export function back() { return slotBack("main"); }

/** @returns {boolean} */
export function canGoBack() { return slotCanGoBack("main"); }

/** @returns {string | null} */
export function currentRoute() { return slotRoute("main"); }

/** @returns {string | null} */
export function currentRootRoute() { return slotRootRoute("main"); }

/** @returns {any} */
export function currentRouteView() { return slotView("main"); }
