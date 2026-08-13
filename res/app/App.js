// res/app/App.js — root application shell: wires the slot-based router
// (res/shared/lib/router.js) into the window per reference-page-scaffold.md. This resolves the
// scaffold's SEED/TODO items: route trees live in per-slot modules colocated here (a single
// "main" tree today), the App component owns setAppElement/registerSlot, and navigation
// triggers are plain navigate()/slotNavigate() calls (no href="route:" convention adopted).

import { route, createRouter, registerSlot, setAppElement, currentRouteView } from "../shared/lib/router.js";
import { Home } from "../pages/Home/Home.js";

// Main-slot route tree. "home" is the boot route: the app had only a placeholder body before
// this page existed, and the Home screen-set IS the app landing in the design — an explicit
// landing-archetype decision, not a hijack of a prior route.
const mainRouter = createRouter({
  routes: [
    route({ path: "home", component: Home }),
  ],
  initial: "home",
});

registerSlot("main", mainRouter);

const appStyleset = CSS.set`
  :root { flow: vertical; width: *; height: *; }
`;

export class App extends Element {

  componentDidMount() {
    // Register this element so router navigation triggers componentUpdate() re-renders.
    setAppElement(this);
  }

  render() {
    return <div class="app" styleset={appStyleset}>{currentRouteView()}</div>;
  }

  // Window-caption intents. SystemRibbon's buttons are click-stub tier — they only dispatch
  // bubbling custom events named for the action; the real window integration is a shell
  // concern and lives here, not in the component.
  ["on ^minimize"]() {
    Window.this.state = Window.WINDOW_MINIMIZED;
    return true;
  }

  ["on ^close"]() {
    Window.this.close();
    return true;
  }
}
