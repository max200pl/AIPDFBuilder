/**
 * Home feature — view-state union (state-aware page, Figma screen-set node 2001:385).
 * State ids are camelCase (valid CSF story-export names for the Gate S1 state-check);
 * they map 1:1 to the `Home - <phase>` top-frame variants in the design:
 *   "noFiles"  — Home - No recent files - ALT           (3496:11300)
 *   "dragDrop" — Home - No recent files - Drag and Drop (3761:7803)
 *   "grid"     — Home - Recent Files Grid               (3761:8051)
 *   "list"     — Home - Recent Files List               (3761:9673)
 *   "dialog"   — Home - Dialogst                        (13043:1285)
 *
 * Types only — no runtime STATES/descriptor. Kernel wiring: TODO (no data layer exists yet).
 */
export type HomeViewState = "noFiles" | "dragDrop" | "grid" | "list" | "dialog";
