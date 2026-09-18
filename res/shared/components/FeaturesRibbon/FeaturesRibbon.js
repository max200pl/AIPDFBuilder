// FeaturesRibbon — the features tab bar (Figma file 2jGq5p5qY4lsf5QK2stfOY,
// node 8006:23276 "State=Home", 1920x40; width fluid).
// Icon pattern follows project convention — see .claude/docs/reference-icon-connection.md
// (static active-state glyph via <img>; asset fetched by the page orchestrator's asset worker).
// Element ids mirror the derived Gate-1 spec slugs (id-basis unification).
//
// `rightCluster` (default false — Home's usage is unaffected): renders the "Modes + Right Icon
// Group" cluster (view/edit-mode pill, "Activate now" CTA, search, share, support, settings) seen
// on the Edit screen's FeaturesRibbon instance (node I15099:13077;15099:13001;15099:13260;15092:7047)
// — a DIFFERENT state of this same Figma component the "State=Home" build never included. Absolute-
// positioned over the styleset root (SystemRibbon/ToolsRibbon's proven "two groups, opposite edges"
// idiom) — `:root` below carries `position: relative` for exactly this (Edit page build,
// AIPDFBuilder 2026-09-10 — omitting it anchors the cluster to the PAGE's root instead of this bar's
// own box, once this component is composed mid-stack rather than tested alone).

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

  /** @type {boolean} render the right-side Modes + Right Icon Group cluster (Edit screen only) */
  rightCluster = false;

  /**
   * @param {{ tabs?: string[], rightCluster?: boolean }} [props]
   */
  constructor(props = {}) {
    super();
    this.tabs = props.tabs ?? DEFAULT_TABS;
    this.rightCluster = props.rightCluster ?? false;
  }

  renderModesCluster() {
    return (
      <div id="modes-right-icon-group" class="features-ribbon__modes">
        <div id="view-cta" class="features-ribbon__view-cta">
          <div id="options" class="features-ribbon__options">
            <div id="toggle-dot-text" class="features-ribbon__toggle">
              <div class="features-ribbon__toggle-dot" />
              <span class="features-ribbon__toggle-label">View</span>
            </div>
          </div>
          <div
            id="service-primary-button"
            role="button"
            class="features-ribbon__activate features-ribbon__clickable"
            data-action="activate"
          >
            <span class="features-ribbon__activate-label">Activate now</span>
          </div>
        </div>
        <div id="right-icon-group" class="features-ribbon__right-icons">
          <div class="features-ribbon__modes-divider">
            <div class="features-ribbon__divider-bar" />
          </div>
          <div
            id="feature-toolbar-item"
            role="button"
            class="features-ribbon__search features-ribbon__clickable"
            data-action="search"
          >
            <img class="features-ribbon__search-icon" src={__DIR__ + "img/search.svg"} />
            <div class="features-ribbon__search-bar">
              <span>Search in document</span>
            </div>
          </div>
          <div class="features-ribbon__modes-divider">
            <div class="features-ribbon__divider-bar" />
          </div>
          <div
            role="button"
            class="features-ribbon__icon-btn features-ribbon__clickable"
            data-action="share"
            title="Share"
          >
            <img class="features-ribbon__icon-btn-img" src={__DIR__ + "img/share.svg"} />
          </div>
          <div
            role="button"
            class="features-ribbon__icon-btn features-ribbon__clickable"
            data-action="support"
            title="Support"
          >
            <img class="features-ribbon__icon-btn-img" src={__DIR__ + "img/support.svg"} />
          </div>
          <div
            role="button"
            class="features-ribbon__icon-btn features-ribbon__clickable"
            data-action="settings"
            title="Settings"
          >
            <img class="features-ribbon__icon-btn-img" src={__DIR__ + "img/settings.svg"} />
          </div>
        </div>
      </div>
    );
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
        {this.rightCluster ? this.renderModesCluster() : []}
      </div>
    );
  }

  ["on click at .features-ribbon__tab"](evt, tab) {
    const labelEl = tab.$(".features-ribbon__tab-label");
    const label = labelEl ? labelEl.textContent : "";
    this.postEvent(new Event("feature-tab-select", { bubbles: true, data: { tab: label } }));
    return true;
  }

  ["on click at .features-ribbon__clickable"](evt, btn) {
    const action = btn.attributes["data-action"];
    if (!action) return true;
    this.postEvent(new Event("feature-action", { bubbles: true, data: { action } }));
    return true;
  }

  // The "View" mode pill (Options) is static/non-interactive this run — the Figma component set
  // defines no toggled/alternate-mode variant for it (out of scope, mirroring ToolsRibbon's
  // identical zoom-field carve-out for a control with no defined second state).
}
