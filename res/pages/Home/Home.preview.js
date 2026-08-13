// res/pages/Home/Home.preview.js — CSF stories for the Home page: one export per HomeViewState
// (Gate S1's state-check renders each via --story-template "{state}") plus Default. Root-wide
// shell stubs live in res/.sdt-preview-shim.js (R2) — nothing view-specific to stub here: this
// project has no kernel/localizer globals, and the dialog card mounts inline via the shim's
// __SDT_PREVIEW__ flag.

import { Home } from "./Home.js";

export const Default = () => <Home viewState="list" />;

export const noFiles = () => <Home viewState="noFiles" />;
export const dragDrop = () => <Home viewState="dragDrop" />;
export const grid = () => <Home viewState="grid" />;
export const list = () => <Home viewState="list" />;
export const dialog = () => <Home viewState="dialog" />;
