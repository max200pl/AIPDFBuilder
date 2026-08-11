/**
 * Sciter.js — дополнительные типы, не покрытые в sciter.d.ts
 * Источник: SDK docs + samples.reactor + samples.sciter
 */

// --- Global constants ---

/** Full URL of the current JS file */
declare const __FILE__: string;

/** Current function name (debug) */
declare const __FUNC__: string;

/** Current line number (debug) */
declare const __LINE__: number;

// --- Signal API ---

interface Signal<T> {
  /** Read/write signal value. Triggers subscribers on change. */
  value: T;
  /** Fire signal unconditionally, even if value unchanged. */
  send(value: T): void;
  /** Read value without subscribing. */
  peek(): T;
  /** Stop signal — free all links and references. */
  dispose(): void;
  /** Input elements where this signal is used as value. */
  readonly valueElements: Element[];
  /** DOM elements observing this signal. */
  readonly observingElements: Element[];
}

// --- Reactor namespace ---

declare namespace Reactor {
  /** Create a reactive signal with initial value. */
  function signal<T>(initialValue: T): Signal<T>;
  /** Create a computed signal derived from other signals. */
  function computed<T>(fn: () => T): Signal<T>;
  /** Run side-effect when dependent signals change. Returns disposable signal. */
  function effect(fn: () => void): Signal<void>;

  /** Clone a virtual node, merging props. */
  function cloneOf(vnode: any, props?: object, kids?: any[]): any;
  /** Check if object is a JSX/virtual node. */
  function isNode(object: any): boolean;
  /** Get tag string from virtual node. */
  function tagOf(vnode: any): string;
  /** Get props object from virtual node. */
  function propsOf(vnode: any): object;
  /** Get children array from virtual node. */
  function kidsOf(vnode: any): any[];

  /** Set context data for descendant components. */
  function setContextData(symbol: symbol, value: any): void;
  /** Get context data from ancestor components. */
  function getContextData(symbol: symbol, defaultValue?: any): any;
}

// --- Element lifecycle & signal extensions ---

interface Element {
  /**
   * Reactor lifecycle: called once after element is attached to DOM.
   * Use for subscriptions, timers, onGlobalEvent.
   */
  componentDidMount?(): void;

  /**
   * Reactor lifecycle: called after componentUpdate() re-render.
   */
  componentDidUpdate?(): void;

  /**
   * Reactor lifecycle: called before element is removed from DOM.
   * Use for cleanup: offGlobalEvent, timers, etc.
   */
  componentWillUnmount?(): void;

  /**
   * Reactor render method. Returns JSX virtual node.
   * Called on mount and on componentUpdate().
   * When called by parent re-render, receives (props, kids).
   */
  render?(props?: object, kids?: any[]): any;

  /**
   * Create a signal scoped to this element's lifetime.
   * Auto-disposed on element removal.
   */
  signal<T>(initialValue: T): Signal<T>;
}

// --- CSS tagged template ---

declare namespace CSS {
  /** Define scoped style set for a component. */
  function set(strings: TemplateStringsArray, ...values: any[]): any;
}

// --- JSX factory ---

/** JSX factory function used by Sciter's JSX transform. */
declare function JSX(type: string | Function, props?: object, ...children: any[]): any;

// --- Missing globals (from SDK docs/md/DOM/Globals.md) ---

/** Number of physical screen pixels per logical CSS px (dip). */
declare const devicePixelRatio: number;

// --- Element.this() lifecycle method ---
// Note: TypeScript cannot express `this()` as a method name.
// In Sciter, `this(props, kids)` is called before render on mount AND parent re-render.
// Use constructor(props, kids) { super(); ... } as alternative in .d.ts context.

// --- Window additions (missing from sciter.d.ts) ---

interface Window {
  /** Window icon. Read/write. */
  icon: Image;
}

// --- Additional Window events (missing from sciter.d.ts windowEvent type) ---
// "closerequest" | "trayicondoubleclick" |
// "system-suspend" | "system-resume" | "system-lock" | "system-unlock" |
// "system-logon" | "system-logout" | "system-shutdown"
