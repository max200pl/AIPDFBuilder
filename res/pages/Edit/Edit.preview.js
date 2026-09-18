// res/pages/Edit/Edit.preview.js — CSF story mounting the whole Edit view. Root-wide shell stubs
// live in res/.sdt-preview-shim.js (R2) — nothing view-specific to stub here (no kernel/localizer
// globals in this project). Edit is not state-aware (Free/Pro is a role prop, not a lifecycle
// phase) so there is a single Default export, no per-state exports.

import { Edit } from "./Edit.js";

export const Default = () => <Edit />;
