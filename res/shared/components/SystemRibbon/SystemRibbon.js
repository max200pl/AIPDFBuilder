// SystemRibbon — dark system/title bar (Figma file 2jGq5p5qY4lsf5QK2stfOY, node 2139:586).
// Icon pattern follows project convention — see .claude/docs/reference-icon-connection.md
// Static white glyphs rendered as-is from img/ (no tinting): the fetched icon masters carried
// the library's baked #485F7D stroke; the placed instances in this bar render white (verified
// pixel-wise against img/_ssim-ref.png), so the unit's img/*.svg strokes are recolored to white.
// Interactivity: click-stub tier — each button dispatches a bubbling custom event named for its
// action (undo/redo/open/save/print/email/new/more/minimize/maximize/close); no real window
// integration in this run.

/**
 * @typedef {Object} SystemRibbonProps
 * @property {string} [title] window title line, default "Document Name.pdf  -  Soda PDF PRO"
 */

const MAIN_ACTIONS = [
  { id: "system-ribbon-icon", action: "undo", glyph: "undo", label: "Undo" },
  { id: "system-ribbon-icon-2", action: "redo", glyph: "redo", label: "Redo" },
  { id: "system-ribbon-icon-3", action: "open", glyph: "open", label: "Open" },
  { id: "system-ribbon-icon-4", action: "save", glyph: "save", label: "Save" },
  {
    id: "system-ribbon-icon-5",
    action: "print",
    glyph: "print",
    label: "Print",
  },
  {
    id: "system-ribbon-icon-6",
    action: "email",
    glyph: "email",
    label: "Email",
  },
  {
    id: "system-ribbon-icon-7",
    action: "new",
    glyph: "plus",
    label: "New document",
  },
  {
    id: "system-ribbon-icon-8",
    action: "more",
    glyph: "chevron",
    label: "More actions",
  },
];

const WINDOW_ACTIONS = [
  {
    id: "system-ribbon-icon-9",
    boxId: "minimize",
    action: "minimize",
    glyph: "minimize",
    label: "Minimize",
  },
  {
    id: "system-ribbon-icon-10",
    boxId: "maximise",
    action: "maximize",
    glyph: "maximize",
    label: "Maximize",
  },
  {
    id: "system-ribbon-icon-11",
    boxId: "close",
    action: "close",
    glyph: "close",
    label: "Close",
  },
];

export class SystemRibbon extends Element {
  title;

  /** @param {SystemRibbonProps} props */
  constructor(props = {}) {
    super();
    this.title = props.title ?? "Document Name.pdf  -  Soda PDF PRO";
  }

  // Glyphs paint via CSS foreground-image on the fixed 24dip boxes (natural SVG size, centered):
  // in-flow <img> children with fractional-physical margins expand the fixed tiles by +1ppx each
  // at DPI 1.25 (Gate-1-proven creep) — foreground paint has zero layout impact.
  renderIcon(glyph) {
    if (glyph === "print")
      // Composite print icon: in-flow stacked rows (CSS paper-in rect, SVG body, SVG tray).
      // No absolute/relative positioning: BOTH Sciter anchors are quirk-proven here (relative
      // re-anchors the box out of the button flow; absolute anchors to the nearest positioned
      // ANCESTOR group, not the parent box). The 1-2px slot/dot details are subsumed by the AA
      // at 24dip — faithful approximation within engine constraints.
      return (
        <div class="system-ribbon__icon24 system-ribbon__icon24--print">
          <div class="system-ribbon__print-top" />
          <div class="system-ribbon__print-main" />
          <div class="system-ribbon__print-tray" />
        </div>
      );
    return (
      <div class={"system-ribbon__icon24 system-ribbon__icon24--" + glyph} />
    );
  }

  render() {
    // <div role="button">, not native <button>: scapp's button behavior adds +1 physical px of
    // intrinsic chrome per element (Gate-1-proven +5px creep across the row) that survives every
    // CSS reset incl. !important. Click-stub tier hand-rolls the events anyway.
    const mainButtons = MAIN_ACTIONS.map((a) => (
      <div
        key={a.id}
        id={a.id}
        role="button"
        class="system-ribbon__btn"
        data-action={a.action}
        title={a.label}
      >
        {this.renderIcon(a.glyph)}
      </div>
    ));

    const windowButtons = WINDOW_ACTIONS.map((w) => (
      <div
        key={w.id}
        id={w.id}
        role="button"
        class="system-ribbon__btn"
        data-action={w.action}
        title={w.label}
      >
        <div
          id={w.boxId}
          class={"system-ribbon__icon24 system-ribbon__icon24--" + w.glyph}
        />
      </div>
    ));

    return (
      <div
        class="system-ribbon"
        styleset={__DIR__ + "SystemRibbon.css#system-ribbon"}
      >
        {/* window-caption lives on the title UNDERLAY, not the ribbon root: with the role on
            the root every descendant (incl. the buttons) is part of the window-drag area and
            real mouse clicks never reach them (verified: click handler silent). The button
            groups stack ABOVE this layer, so they win the hit test; empty areas still drag. */}
        <div class="system-ribbon__title-layer" role="window-caption">
          <span
            id="document-name-pdf-soda-p-d-f-p-r-o"
            class="system-ribbon__title"
          >
            {this.title}
          </span>
        </div>
        <div id="main-actions-soda-logo" class="system-ribbon__left">
          <div id="soda-toolbar-logo" class="system-ribbon__logo">
            <div class="system-ribbon__logo-mark" />
          </div>
          <div id="main-actions" class="system-ribbon__actions">
            {mainButtons}
          </div>
        </div>
        <div id="user-actions" class="system-ribbon__right">
          {windowButtons}
        </div>
      </div>
    );
  }

  ["on click at .system-ribbon__btn"](evt, btn) {
    const action = btn.attributes["data-action"];
    if (!action) return true;
    // Bubbling custom event named for the action — parents listen via ["on ^<action>"].
    this.dispatchEvent(new Event(action, { bubbles: true }));
    return true;
  }
}
