// res/shared/components/GridAndLists/GridAndLists.js
// Icon pattern follows project convention — see .claude/docs/reference-icon-connection.md
// (single static SVG asset with baked design colors — no tinting, no fill= pass-through).

/**
 * @typedef {Object} GridAndListsProps
 * @property {"grid"|"list"} [type] Reserved view-mode hint (defaults to "grid"; no toggle state
 *   is kept in this component — the parent owns any selection).
 */

/**
 * GridAndLists — 24x24dip grid/list view-toggle icon
 * (Figma 2jGq5p5qY4lsf5QK2stfOY node 2728:6825, "State=Default, Type=Grid").
 *
 * Click-stub interactivity: a click dispatches a bubbling "view-toggle" custom event
 * (view-toggle intent for the parent to act on). Listen with `["on view-toggle"]`.
 */
export class GridAndLists extends Element {

  /** @type {"grid"|"list"} */
  type = "grid";

  /**
   * @param {GridAndListsProps} [props]
   */
  constructor(props = {}) {
    super();
    this.type = props?.type ?? "grid";
  }

  render() {
    return <div class="grid-and-lists" styleset={__DIR__ + "GridAndLists.css#grid-and-lists"}>
      <img id="grid-icon" class="grid-and-lists__icon" src={__DIR__ + "img/grid-icon.svg"} />
    </div>;
  }

  // click-stub tier: emit the view-toggle intent; no internal state change this run.
  ["on click"](evt, el) {
    this.postEvent(new Event("view-toggle", { bubbles: true, data: { type: this.type } }));
    return true;
  }
}
