// FeaturesRibbon — the features tab bar (Figma file 2jGq5p5qY4lsf5QK2stfOY,
// node 8006:23276 "State=Home", 1920x40; width fluid).
// Icon pattern follows project convention — see .claude/docs/reference-icon-connection.md
// (static active-state glyph via <img>; asset fetched by the page orchestrator's asset worker).
// Element ids mirror the derived Gate-1 spec slugs (id-basis unification).

/** Default tab labels — VERBATIM from the design, including the "AI Assitant" typo. */
const DEFAULT_TABS = [
  "View",
  "Create & Convert",
  "Fill & Sign",
  "Edit",
  "Page",
  "Comment",
  "Secure",
  "Forms",
  "E-Sign",
  "OCR",
  "Translate",
  "AI Assitant",
];

/**
 * Features ribbon tab bar. Click-stub interactivity tier: clicking a tab dispatches a
 * bubbling "feature-tab-select" event carrying the tab label in `evt.data.tab`;
 * no selection state is kept in this component (caller owns any future selection).
 */
export class FeaturesRibbon extends Element {
  /** @type {string[]} */
  tabs = DEFAULT_TABS;

  /**
   * @param {{ tabs?: string[] }} [props]
   */
  constructor(props = {}) {
    super();
    this.tabs = props.tabs ?? DEFAULT_TABS;
  }

  render() {
    return (
      <div id="features-ribbon" styleset={__DIR__ + "FeaturesRibbon.css#features-ribbon"}>
        <div id="left-icon-group-features" class="features-ribbon__group">
          <div id="left-icon-group" class="features-ribbon__home">
            <div id="feature-toolbar-item" class="features-ribbon__home-button">
              <img class="features-ribbon__home-icon" src={__DIR__ + "img/home-active.svg"} />
            </div>
          </div>
          <div id="divider" class="features-ribbon__divider">
            <div class="features-ribbon__divider-bar"></div>
          </div>
          <div id="features" class="features-ribbon__tabs">
            {this.tabs.map((label, index) => (
              <div
                id={index === 0 ? "tabs" : "tabs-" + (index + 1)}
                key={index}
                class="features-ribbon__tab"
              >
                <span
                  id={index === 0 ? "feature-name" : "feature-name-" + (index + 1)}
                  class="features-ribbon__tab-label"
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  ["on click at .features-ribbon__tab"](evt, tab) {
    const labelEl = tab.$(".features-ribbon__tab-label");
    const label = labelEl ? labelEl.textContent : "";
    this.postEvent(new Event("feature-tab-select", { bubbles: true, data: { tab: label } }));
    return true;
  }
}
