// ToolsRibbon — the "Type=Edit" tools bar (Figma file 2jGq5p5qY4lsf5QK2stfOY, node 15092:7800,
// 1920x50dip; width fluid).
// Icon pattern follows project convention — see .claude/docs/reference-icon-connection.md
// (static glyph via <img>, baked design color — no host fill/tint; burger-menu.svg is a shared
// placeholder glyph reused across all 13 tool buttons per the design fetch — do not invent
// distinct icons; the zoom-out control renders icon-less per the design fetch, which exposes no
// distinct zoom-out glyph).
// Layout: every button/divider width below is copied verbatim from the derived Gate-1 spec
// (scratchpad/edit-page/units/ToolsRibbon/spec.json) rather than left to auto-centering — the
// project calibration quirk warns that differently-sized children under one shared centring
// parent don't reliably centre, so each item gets an explicit width + its own centred children.
// Element ids mirror the derived Gate-1 spec node ids (id-basis unification) so the authored spec
// resolves on the cheap "exact" rung.
// Interactivity: click-stub tier — each tool button + the zoom-out/zoom-in buttons dispatch a
// single bubbling "tool-select" event carrying the action id in evt.data.action, mirroring
// FeaturesRibbon's "feature-tab-select" pattern. The "100%" zoom field is explicitly static/
// non-interactive — no click handler, no dropdown/menu-content variant exists in this design
// fetch (out of scope this run).

/** Tool entries + interleaved dividers, in Figma z-order. Width = the exact Gate-1 spec box
 * width (icon-24 + label centred inside it — see ToolsRibbon.css). */
const TOOLS = [
  { kind: "button", id: "tool-ribbon-button", action: "add-text", label: "Add text", width: 63 },
  { kind: "button", id: "tool-ribbon-button-2", action: "insert-image", label: "Insert image", width: 89 },
  { kind: "button", id: "tool-ribbon-button-3", action: "link", label: "Link", width: 36 },
  { kind: "divider", id: "divider" },
  { kind: "button", id: "tool-ribbon-button-4", action: "format-painter", label: "Format painter", width: 103 },
  { kind: "divider", id: "divider-2" },
  { kind: "button", id: "tool-ribbon-button-5", action: "select-text", label: "Select text", width: 75 },
  { kind: "divider", id: "divider-3" },
  { kind: "button", id: "tool-ribbon-button-6", action: "page-number", label: "Page number", width: 95 },
  { kind: "button", id: "tool-ribbon-button-7", action: "watermark", label: "Watermark", width: 81 },
  { kind: "button", id: "tool-ribbon-button-8", action: "header-footer", label: "Header and footer", width: 123 },
  { kind: "button", id: "tool-ribbon-button-9", action: "bates-numbers", label: "Bates numbers", width: 104 },
  { kind: "button", id: "tool-ribbon-button-10", action: "remove-page-marks", label: "Remove page marks", width: 138 },
  { kind: "divider", id: "divider-4" },
  { kind: "button", id: "tool-ribbon-button-11", action: "spell-check", label: "Spell check", width: 81 },
  { kind: "divider", id: "divider-5" },
  { kind: "button", id: "tool-ribbon-button-12", action: "ruler", label: "Ruler", width: 43 },
  { kind: "button", id: "tool-ribbon-button-13", action: "grid", label: "Grid", width: 38 },
];

/**
 * @typedef {Object} ToolsRibbonProps
 * @property {Array} [tools] override the default TOOLS array
 */
export class ToolsRibbon extends Element {
  tools = TOOLS;

  /** @param {ToolsRibbonProps} [props] */
  constructor(props = {}) {
    super();
    this.tools = props.tools ?? TOOLS;
  }

  // One shared 24x24 static glyph across every tool button (per the design fetch).
  renderToolButton(item, frameId, textId) {
    return (
      <div
        key={item.id}
        id={item.id}
        role="button"
        class="tools-ribbon__btn"
        style={"width:" + item.width + "dip;"}
        data-action={item.action}
        title={item.label}
      >
        <img
          id={frameId}
          class="tools-ribbon__btn-icon"
          src={__DIR__ + "img/burger-menu.svg"}
        />
        <span id={textId} class="tools-ribbon__btn-label">
          {item.label}
        </span>
      </div>
    );
  }

  renderDivider(item) {
    return (
      <div key={item.id} id={item.id} class="tools-ribbon__divider">
        <div class="tools-ribbon__divider-bar" />
      </div>
    );
  }

  render() {
    let toolIndex = 0;
    const items = this.tools.map((item) => {
      if (item.kind === "divider") return this.renderDivider(item);
      toolIndex += 1;
      const suffix = toolIndex === 1 ? "" : "-" + toolIndex;
      return this.renderToolButton(item, "frame-53437" + suffix, "text" + suffix);
    });

    // Icon-less zoom-out box per the design fetch (no distinct zoom-out glyph resolved). The
    // child id below mirrors the derived Gate-1 spec node — a shared Figma icon-slot instance
    // reused generically across the library ("minimize" is that instance's own name, not a
    // semantic label for this control).
    const zoomOutButton = (
      <div
        id="feature-toolbar-item"
        role="button"
        class="tools-ribbon__zoom-btn"
        data-action="zoom-out"
        title="Zoom out"
      >
        <div id="minimize" class="tools-ribbon__zoom-icon-box" />
      </div>
    );

    return (
      <div id="tools-ribbon" styleset={__DIR__ + "ToolsRibbon.css#tools-ribbon"}>
        <div id="tools" class="tools-ribbon__tools">
          {items}
        </div>
        <div id="zoom" class="tools-ribbon__zoom">
          {zoomOutButton}
          <div id="fields" class="tools-ribbon__zoom-field">
            <span id="add-field-text-here" class="tools-ribbon__zoom-value">
              100%
            </span>
            <img
              id="text-field-chevron"
              class="tools-ribbon__zoom-chevron"
              src={__DIR__ + "img/chevron-down.svg"}
            />
          </div>
          <div
            id="feature-toolbar-item-2"
            role="button"
            class="tools-ribbon__zoom-btn"
            data-action="zoom-in"
            title="Zoom in"
          >
            <img id="plus" class="tools-ribbon__zoom-icon" src={__DIR__ + "img/plus.svg"} />
          </div>
        </div>
      </div>
    );
  }

  ["on click at .tools-ribbon__btn"](evt, btn) {
    const action = btn.attributes["data-action"];
    if (!action) return true;
    this.postEvent(new Event("tool-select", { bubbles: true, data: { action } }));
    return true;
  }

  ["on click at .tools-ribbon__zoom-btn"](evt, btn) {
    const action = btn.attributes["data-action"];
    if (!action) return true;
    this.postEvent(new Event("tool-select", { bubbles: true, data: { action } }));
    return true;
  }
}
