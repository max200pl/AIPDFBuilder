// tools/dev-bridge/adapter.js — PROJECT-OWNED: the one file that binds the toolkit's dev bridge to
// THIS app's routing idiom. `sciter-devtools test init` writes a skeleton once and never overwrites
// it; everything else in this folder is toolkit-owned and regenerated.
//
// Idiom (reference-page-scaffold.md § What exists today): res/shared/lib/router.js is a SLOT router.
// The app registers one slot, "main" (res/app/App.js), so every function below is that slot.

import {
  slotNavigate, slotBack, slotRoute, slotRoutes, slotChain,
} from "../../res/shared/lib/router.js";

// URL of the repository root (where `.dev-bridge.json` and `.dev-bridge.log` live).
export const repoRootUrl = __DIR__ + "../../";

/** Navigate the main view to a route id (the graph's route id, e.g. "architect"). */
export function navigate(route) { slotNavigate("main", route); }

/** Go back one step in the main view's history; true when a step was taken. */
export function back() { return slotBack("main"); }

/** The current route id of the main view. */
export function route() { return slotRoute("main"); }

/** Every registered route id (placeholders included). */
export function routes() { return slotRoutes("main"); }

/** The nested route chain (root first) as route path segments. */
export function chain() { return slotChain("main").map((n) => n.path); }

// --- feature-build hooks -----------------------------------------------------------------------
// setFixture / reset / dropFiles are wired per feature against that feature's `_debug/` mock, which
// the entry document installs as the feature's asset behind globalThis.__SDT_ALLOW_MOCK__.
// UNWIRED until a feature's mock exists — the bridge reports them as not implemented, which is the
// honest red, not a fabricated green.
