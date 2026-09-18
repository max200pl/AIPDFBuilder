// RightPanelTab — 40x80dip vertical rail of two stacked 40x40dip icon-button cells.
// Figma: file 2jGq5p5qY4lsf5QK2stfOY, node 15092:8965 ("ItemCount=2").
// Mirrors between the LEFT and RIGHT edges of the workspace via the `side` prop: the border +
// rounded corners always sit on the edge facing AWAY from the document canvas.
// Icon pattern follows project convention — static SVG asset under img/ with its baked design
// stroke (#485F7D), rendered via <img>; not tinted by the host (see
// .claude/docs/reference-icon-connection.md).
// DOM ids on layout-bearing nodes are the Gate-1 spec anchors (derived slugs) — keep them stable;
// the layout pre-check resolves its assertions against them.

/**
 * @typedef {Object} RightPanelTabProps
 * @property {"left"|"right"} [side] Which workspace edge this rail sits on (default "right").
 *   "right" -> border + rounding on the LEFT edge (the edge facing away from the canvas).
 *   "left"  -> mirrored: border + rounding on the RIGHT edge.
 */

export class RightPanelTab extends Element {
  side = "right";

  /** @param {RightPanelTabProps} [props] */
  constructor(props = {}) {
    super();
    this.side = props?.side === "left" ? "left" : "right";
  }

  render() {
    const mod = this.side === "left" ? " right-panel-tab--left" : "";
    return (
      <div class={"right-panel-tab" + mod}
           styleset={__DIR__ + "RightPanelTab.css#right-panel-tab"}>
        <div id="panel-icon" class="right-panel-tab__cell" data-index="0">
          <img id="bookmark" class="right-panel-tab__icon" src={__DIR__ + "img/bookmark.svg"} />
        </div>
        <div id="panel-icon-2" class="right-panel-tab__cell" data-index="1">
          <img id="bookmark-2" class="right-panel-tab__icon" src={__DIR__ + "img/bookmark.svg"} />
        </div>
      </div>
    );
  }

  // Interactivity: click-stub — each cell announces its own index; the host decides what
  // selecting a panel tab actually does (open a bookmarks panel, etc.). No registry Button-tier
  // primitive exists yet in this project (component-registry.json has none) so each cell is its
  // own clickable sub-element, following the same root-click-stub convention already established
  // by GridAndLists / QuickActionCard / FileListRow, scoped to the cell selector.
  ["on click at .right-panel-tab__cell"](evt, el) {
    const index = Number(el.attributes["data-index"]);
    this.dispatchEvent(new Event("panel-tab-select", { bubbles: true, data: { index } }));
    return true;
  }
}
