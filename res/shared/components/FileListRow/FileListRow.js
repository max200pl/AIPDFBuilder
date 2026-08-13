// FileListRow — one recent-file list row: 24dip document icon + name/path text column on the
// left, an empty 32dip action slot (reserved for future hover actions) on the right.
// Figma: file 2jGq5p5qY4lsf5QK2stfOY, node 3698:15485 ("State=Default"; 1200×80 master, fluid width).
// Icon pattern follows project convention — static SVG asset under img/ with its baked design
// stroke (#485F7D), rendered via <img>; not tinted by the host (see
// .claude/docs/reference-icon-connection.md).
// DOM ids on layout-bearing nodes are the Gate-1 spec anchors (derived slugs of the Figma layer
// names) — keep them stable; the layout pre-check resolves its assertions against them.

/**
 * @typedef {Object} FileListRowProps
 * @property {string} name  File display name (single line, ellipsized past 435dip).
 * @property {string} path  Full file path (single line, ellipsized past 448dip); also the
 *                          payload of the bubbling "file-row-click" event.
 */

export class FileListRow extends Element {
  name = "";
  path = "";

  /** @param {FileListRowProps} props */
  constructor(props) {
    super();
    this.name = props?.name ?? "";
    this.path = props?.path ?? "";
  }

  render() {
    return (
      <div styleset={__DIR__ + "FileListRow.css#file-list-row"}>
        <div id="icon-file-name" class="file-list-row__left">
          <img id="single-view" class="file-list-row__icon" src={__DIR__ + "img/doc-icon.svg"} />
          <div id="file-name-info" class="file-list-row__info">
            <div id="file-sample-name" class="file-list-row__name">{this.name}</div>
            <div id="c-users-amazing-user-documents-invoice23456-pdf" class="file-list-row__path">
              {this.path}
            </div>
          </div>
        </div>
        <div id="right-icons" class="file-list-row__actions" />
      </div>
    );
  }

  // Interactivity: click-stub — no real behavior; announce the clicked file to the host view as
  // a bubbling custom event carrying the path. The host decides what opening a recent file does.
  ["on click"]() {
    this.dispatchEvent(new Event("file-row-click", { bubbles: true, data: this.path }));
    return true;
  }
}
