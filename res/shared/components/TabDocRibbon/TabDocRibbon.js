// TabDocRibbon — the open-documents tab strip (Figma file 2jGq5p5qY4lsf5QK2stfOY,
// node 2139:589 "TabDocRibbon", 1920x40; width fluid).
// Element ids mirror the derived Gate-1 spec slugs (id-basis unification):
// doc-tabs / tab-doc-item / document-name-pdf.

/** Default open-document tab — VERBATIM from the design. */
const DEFAULT_TABS = [{ id: "doc-1", name: "Longer Document Name.pdf" }];

/**
 * Open-document tab strip. Click-stub interactivity tier: clicking a tab dispatches a
 * bubbling "doc-tab-select" event carrying the tab id in `evt.data.id`; no selection
 * state is kept in this component (caller owns any future active-tab state). Closing a
 * tab is out of scope — the design has no close affordance for this node.
 */
export class TabDocRibbon extends Element {
  /** @type {{name: string, id: string}[]} */
  tabs = DEFAULT_TABS;

  /**
   * @param {{ tabs?: {name: string, id: string}[] }} [props]
   */
  constructor(props = {}) {
    super();
    this.tabs = props.tabs ?? DEFAULT_TABS;
  }

  render() {
    return (
      <div id="tab-doc-ribbon" styleset={__DIR__ + "TabDocRibbon.css#tab-doc-ribbon"}>
        <div id="doc-tabs" class="tab-doc-ribbon__tabs">
          {this.tabs.map((tab, index) => (
            <div
              id={index === 0 ? "tab-doc-item" : "tab-doc-item-" + (index + 1)}
              key={tab.id}
              class="tab-doc-ribbon__tab"
              data-tab-id={tab.id}
            >
              <span
                id={index === 0 ? "document-name-pdf" : "document-name-pdf-" + (index + 1)}
                class="tab-doc-ribbon__tab-label"
              >
                {tab.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  ["on click at .tab-doc-ribbon__tab"](evt, tab) {
    const id = tab.attributes["data-tab-id"];
    this.postEvent(new Event("doc-tab-select", { bubbles: true, data: id }));
    return true;
  }
}
