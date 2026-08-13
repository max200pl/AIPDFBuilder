// res/pages/Home/Home.js — Home page view (state-aware; registry type "page").
// Figma: file 2jGq5p5qY4lsf5QK2stfOY, screen-set node 2001:385 — five `Home - <phase>` variants
// dispatched over `this.viewState` (see Home.Types.d.ts). LAYOUT-FIRST: the persistent shell
// (SystemRibbon + FeaturesRibbon + quick-action panel) renders once; ONLY the recent-section
// slot switches per state. State lives in a plain `viewState` field + componentUpdate() —
// never `this.state` (Sciter's Element reserves `.state`; assigning it blanks the render).

import { SystemRibbon } from "../../shared/components/SystemRibbon/SystemRibbon.js";
import { FeaturesRibbon } from "../../shared/components/FeaturesRibbon/FeaturesRibbon.js";
import { QuickActionCard } from "../../shared/components/QuickActionCard/QuickActionCard.js";
import { SortBy } from "../../shared/components/SortBy/SortBy.js";
import { GridAndLists } from "../../shared/components/GridAndLists/GridAndLists.js";
import { FileListRow } from "../../shared/components/FileListRow/FileListRow.js";
import { FileThumbnail } from "../../shared/components/FileThumbnail/FileThumbnail.js";
import { PrimaryButton } from "../../shared/components/PrimaryButton/PrimaryButton.js";
import { ShowMessageBox } from "../../shared/dialogs/MessageBox/MessageBox.js";

/** @typedef {"noFiles"|"dragDrop"|"grid"|"list"|"dialog"} HomeViewState */

/** Quick-action panel content (design order, 2 per row; "Customize" is the icon-less card). */
const QUICK_ACTIONS = [
  { icon: "open-40.svg", label: "Open PDF", action: "open-pdf" },
  { icon: "redact-40.svg", label: "Redact PDF", action: "redact" },
  { icon: "batch-40.svg", label: "Batch", action: "batch" },
  { icon: "page-crop-40.svg", label: "Page crop", action: "page-crop" },
  { icon: "edit-pdf-40.svg", label: "Edit PDF", action: "edit-pdf" },
  { icon: "edit-text-40.svg", label: "Edit text", action: "edit-text" },
  { icon: "move-40.svg", label: "Move pages", action: "move-pages" },
  { icon: "split-40.svg", label: "Split PDF", action: "split" },
  { icon: "fill-sign-40.svg", label: "E-sign document", action: "e-sign" },
  { label: "Customize", action: "customize" },
];

// TODO(kernel): static sample data straight from the design — replace with the recent-files
// service once a data layer exists (no AssetBaseComponent/kernel in this project yet).
const SAMPLE_LIST_FILE = {
  name: "File Sample Name ",
  path: "C:\\Users\\AmazingUser\\Documents\\Invoice23456.pdf",
};
const LIST_ROW_COUNT = 9;
const GRID_ROWS = 2;
const GRID_COLS = 6;

export class Home extends Element {

  /** @type {HomeViewState} */
  viewState = "noFiles";

  /** @type {{ name: string, path: string }[]} files opened this session — when empty, the
   * list/grid render the static design sample (previews/state-checks rely on it) */
  files = [];

  /** @param {{ viewState?: HomeViewState, childView?: any }} [props] */
  constructor(props = {}) {
    super();
    this.viewState = props.viewState ?? "noFiles";
  }

  /** @param {HomeViewState} next */
  setViewState(next) {
    this.componentUpdate({ viewState: next });
  }

  renderCards() {
    const rows = [];
    for (let i = 0; i < QUICK_ACTIONS.length; i += 2) {
      const pair = QUICK_ACTIONS.slice(i, i + 2);
      rows.push(
        <div key={"row-" + i} class="home__cards-row">
          {pair.map((card, j) => (
            <div key={card.action} class={j > 0 ? "home__cell--gap" : ""}>
              <QuickActionCard icon={card.icon} label={card.label} action={card.action} />
            </div>
          ))}
        </div>
      );
    }
    return rows;
  }

  renderToolbar() {
    return (
      <div id="filters-sorting" class="home__toolbar">
        <div id="tabs" class="home__heading">Recent</div>
        <div id="document-sorting" class="home__sorting">
          <SortBy />
          <div class="home__sorting-toggle"><GridAndLists /></div>
        </div>
      </div>
    );
  }

  renderList() {
    const files = this.files.length
      ? this.files
      : Array(LIST_ROW_COUNT).fill(SAMPLE_LIST_FILE);
    const rows = files.map((f, i) => (
      <FileListRow key={"file-" + i} name={f.name} path={f.path} />
    ));
    return (
      <div id="recent-block" class="home__recent-block">
        {this.renderToolbar()}
        <div id="list-of-files" class="home__list">{rows}</div>
      </div>
    );
  }

  renderGrid() {
    const files = this.files.length
      ? this.files
      : Array(GRID_ROWS * GRID_COLS).fill({ name: "filename-long.pdf" });
    const rows = [];
    for (let r = 0; r * GRID_COLS < files.length; r++) {
      const tiles = files.slice(r * GRID_COLS, (r + 1) * GRID_COLS).map((f, c) => (
        <div key={"tile-" + r + "-" + c} class={c > 0 ? "home__tile--gap" : ""}>
          <FileThumbnail name={f.name} />
        </div>
      ));
      rows.push(
        <div key={"grid-row-" + r} class={"home__grid-row" + (r > 0 ? " home__grid-row--second" : "")}>
          {tiles}
        </div>
      );
    }
    return (
      <div id="recent-block" class="home__recent-block">
        {this.renderToolbar()}
        <div id="recent-documents" class="home__grid">{rows}</div>
      </div>
    );
  }

  renderEmpty() {
    return (
      <div id="recent-section-empty" class="home__empty">
        <img id="no-files-visual" class="home__empty-visual" src={__DIR__ + "img/no-files-visual.svg"} />
        <div id="empty-title" class="home__empty-title">No recent documents</div>
        <div id="empty-body" class="home__empty-body">
          All the documents which have been opened recently will be displayed here.
        </div>
        <div class="home__empty-cta"><PrimaryButton label="Open file" /></div>
      </div>
    );
  }

  /** The per-state content slot — the ONLY part that switches; the shell renders once. */
  renderSlot() {
    switch (this.viewState) {
      case "grid": return this.renderGrid();
      case "list":
      case "dialog": return this.renderList();
      case "noFiles":
      case "dragDrop":
      default: return this.renderEmpty();
    }
  }

  renderDialogLayer() {
    // Headless preview/story path: the root shim sets __SDT_PREVIEW__ and ShowMessageBox()
    // hands back the card body vnode for inline mount. In the running app the dialog is a real
    // modal window — TODO(kernel): trigger ShowMessageBox() from the open-protected-file flow
    // instead of rendering it as a page layer.
    const card = globalThis.__SDT_PREVIEW__ ? ShowMessageBox({}) : null;
    return (
      <div id="overlay" class="home__scrim">
        {card ? <div id="message-box-host" class="home__dialog-card">{card}</div> : []}
      </div>
    );
  }

  render() {
    const dragging = this.viewState === "dragDrop";
    return (
      <div class="home" data-view-state={this.viewState} styleset={__DIR__ + "Home.css#home"}>
        <SystemRibbon />
        <FeaturesRibbon />
        <div id="main-content" class="home__main">
          <div id="customize-panel" class="home__left">
            <div id="action-cards" class="home__cards">{this.renderCards()}</div>
          </div>
          <div id="recent-section" class={"home__right" + (dragging ? " home__right--dropzone" : "")}>
            <div class="home__recent">{this.renderSlot()}</div>
          </div>
        </div>
        {this.viewState === "dialog" ? this.renderDialogLayer() : []}
      </div>
    );
  }

  /** Open-file flow: system file-picker, then present the chosen files in the list view.
   * Duplicate picks (same path) are ignored; cancel leaves the current state untouched. */
  openFileDialog() {
    const picked = Window.this.selectFile({
      mode: "open-multiple",
      filter: "PDF files (*.pdf)|*.pdf|All files (*.*)|*.*",
      caption: "Open file",
    });
    if (!picked || picked.length === 0) return; // cancelled
    const files = [...this.files];
    for (const url of Array.isArray(picked) ? picked : [picked]) {
      const path = URL.toPath(url);
      if (!files.some((f) => f.path === path))
        files.push({ name: path.split(/[\\/]/).pop() || path, path });
    }
    this.componentUpdate({ files, viewState: "list" });
  }

  // Semantic-event sinks — child components bubble intents; unhandled ones stay kernel TODO.
  ["on quick-action"](evt) {
    if (evt.data === "open-pdf") this.openFileDialog();
    // TODO(kernel): remaining quick actions (evt.data)
    return true;
  }
  ["on file-row-click"](evt) {
    // The design's "protected document" MessageBox for the clicked row. The page's "dialog"
    // state paints the scrim (a modal window does not dim its parent by itself); the dialog is
    // a real modal window per the SDK (Window.md § modal({params})) — posted, so this turn's
    // re-render paints the scrim BEFORE modal() blocks the event loop.
    // TODO(kernel): branch on the file's actual protection state once a data layer exists.
    const path = String(evt.data ?? "");
    const name = path.split(/[\\/]/).pop() || path;
    this.componentUpdate({ viewState: "dialog" });
    this.post(() => {
      ShowMessageBox({ documentName: name }); // blocks until Window.this.close(value) inside
      this.setViewState("list");
    });
    return true;
  }
  ["on file-thumbnail-open"](evt) { /* TODO(kernel): open the recent file (evt.data.name) */ return true; }
  ["on button-press"]() { this.openFileDialog(); return true; } // empty-state "Open file" CTA
  ["on ^open"]() { this.openFileDialog(); return true; } // SystemRibbon "Open" toolbar button
  ["on view-toggle"]() {
    // View-local behavior (not kernel data): flip between the two populated presentations.
    this.setViewState(this.viewState === "grid" ? "list" : "grid");
    return true;
  }
}
