# Component Creation Template

> SEED — adjust to your project's conventions. This project has no real components yet; the
> recipe below is grounded in the Reactor idioms demonstrated by the vendored Sciter js-sdk
> (`samples.reactor/`), not in anything observed in `res/`. Replace this file wholesale once
> `analyze-frontend` has real components to detect (see Handoff below).

## Grounding

Sciter.js ships a built-in ReactJS-like implementation called **Reactor**. Components are
`Element` subclasses (class components) or plain functions returning JSX (functional components).
No import is needed — `Element`, `JSX`, and JSX syntax are globally available once
`jsconfig.json`'s `"jsx": "react"` is honored by the toolchain (already set in this repo).

Sources read for this seed: `samples.reactor/basic/component-clock.htm`,
`samples.reactor/tabs/tabs.js`, `samples.reactor/form/form.js`, `samples.reactor/routing/*`,
`samples.reactor/styling/*.js`.

## File layout

> SEED — no component directory convention exists yet in `res/`. Proposed layout, mirroring the
> `shared/lib/*.js` flat pattern already used for `router.js`/`tokens.css`:

```
res/
  shared/
    components/
      <ComponentName>/
        <ComponentName>.js      — the component class/function + render()
        <ComponentName>.css     — styleset consumed via __DIR__ + "<ComponentName>.css#<id>"
```

`__DIR__` (used in `form.js`, `tabs.js`) resolves relative to the importing module, so a
component's `.js` and `.css` can sit side by side and be referenced without a hardcoded path.

## Canonical skeleton — class component

```js
export class ComponentName extends Element {

  // props become instance fields set in the constructor — not auto-bound like React
  someValue;

  constructor(props, kids) {
    super();
    this.someValue = props.someValue ?? defaultValue;
    this.kids = kids; // pass children through if the component wraps content
  }

  // Lifecycle: fires once the element is attached to the real DOM
  componentDidMount() {}

  // Lifecycle: fires just before teardown — clear timers/listeners here
  componentWillUnmount() {}

  render() {
    return <div styleset={__DIR__ + "ComponentName.css#root"}>
      {this.kids}
    </div>;
  }

  // Event handlers are string-keyed methods: ["on <event> [at <selector>]"]
  ["on click at button.primary"](evt, el) {
    this.componentUpdate({ someValue: !this.someValue });
    return true; // true = event consumed, stops propagation
  }
}
```

## Canonical skeleton — functional component

Use for stateless, props-in/markup-out pieces (see `FormError` in `samples.reactor/form/form.js`):

```js
export function ComponentName(props) {
  if (!props.visible) return <div/>;
  return <div.hint>{props.label}</div>;
}
```

## Props, state, and updates

- Props arrive as the constructor's first argument (`props`), children as the second (`kids`) —
  destructure what you need, assign to instance fields.
- There is no separate `setState` — call **`this.componentUpdate({ field: value, ... })`** to
  merge fields and trigger a re-render. `this.state` also exists as a plain object bag when a
  component prefers getter/setter-mediated state (see `Form.value` in `form.js`).
- Mount an instance dynamically (e.g. rendering `this.sections[i]` by class reference) with
  **`JSX(ComponentClass, props, children)`** rather than JSX literal syntax — see `Tabs.render()`.
- Give list items a **`key`** prop (`label key={index}`) exactly as in `Tabs.render()`.

## Styling — `styleset`

Every component-root element takes a `styleset` attribute. Three forms are demonstrated by the
js-sdk (see `samples.reactor/styling/`):

1. **External file + selector**: `styleset={__DIR__ + "ComponentName.css#root"}` — one `.css` file
   per component, `#root` is a `@set` block name inside it. **Preferred** for anything beyond a
   one-off.
2. **Inline `CSS.set` template tag**: `const styleset = CSS.set\`:root { ... }\`;` then
   `styleset={styleset}` — fine for a tiny, self-contained style with no reuse.
3. **In-document `<style>` + `#id"`** — only seen in raw `.htm` samples, not appropriate for a
   module-based component.

Follow [Styling Flow](reference-styling-flow.md) for how token/mixin values from `tokens.css` /
`typography.css` flow into a component's `.css` file.

## Naming & events

- Component class names: `PascalCase`, matching the file name (`Tabs` in `tabs.js`).
- Event-handler methods: string-literal computed keys, `["on <domEvent> [at <cssSelector>]"]` —
  Sciter's own convention, not a project invention. Selector-qualified handlers
  (`"on click at button.primary"`) scope the listener to descendants matching the selector; bare
  `["on click"]` binds to the component root.
- Custom/synthetic events dispatched by a component and consumed by a parent follow the same
  string-key form on the *listening* side (see `["on ^submit"]` in `form.js` for a bubbling
  custom event, and `onnavigateto` in `samples.reactor/routing/main.htm` for a plain lowercase
  method name — Sciter accepts both forms; prefer the bracketed `on <event>` form for anything
  with a selector or a space in the event name).
- Units: use `dip` (device-independent pixels) for sizes/spacing in component CSS, matching
  `tokens.css`'s `--space-*`/`--radius-*` values — never raw `px`.

## Full example (annotated)

```js
// res/shared/components/Tabs/Tabs.js
export class Tabs extends Element {

  labels = [];
  current = 0;

  constructor({ labels, sections, current }) {
    super();
    this.labels = labels;
    this.sections = sections; // array of component classes, one per tab
    this.current = current ?? 0;
  }

  render() {
    const labels = this.labels.map((label, index) =>
      <label key={index} current={index == this.current}>{label}</label>);
    const currentTab = JSX(this.sections[this.current], {}, []);
    return <tabs styleset={__DIR__ + "Tabs.css#tabs"}>
      <labels>{labels}</labels>
      {currentTab}
    </tabs>;
  }

  get tab() { return this.current; }
  set tab(index) { this.componentUpdate({ current: index }); }

  ["on press at label[current=false]"](evt, label) {
    this.tab = label.attributes["key"];
    return true;
  }
}
```

## Handoff

This whole file is a seed. Once real components exist under `res/`, run `/analyze-frontend` →
`/update-frontend-docs` — that pipeline **replaces this file in place** (same path) with the
actually-detected component-creation recipe. Don't hand-merge; let detection overwrite the seed.
