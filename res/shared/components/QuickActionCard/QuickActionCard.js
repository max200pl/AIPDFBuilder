// QuickActionCard — 148×148 quick-action tile: optional 40dip icon over a centered label.
// Figma: file 2jGq5p5qY4lsf5QK2stfOY, node 3760:15072 ("State=Default").
// Icon pattern follows project convention — static SVG assets under img/ with their baked design
// stroke (#485F7D), rendered at natural size via <img>; not tinted by the host (see
// .claude/docs/reference-icon-connection.md).

/**
 * @typedef {Object} QuickActionCardProps
 * @property {string} [icon]   SVG asset filename inside this component's img/ (e.g. "open-40.svg")
 *                             or a full path/URL. Omit for a label-only card (e.g. "Customize").
 * @property {string} label    Card caption; centered, may wrap to 2 lines.
 * @property {string} [action] Action id carried by the bubbling "quick-action" event
 *                             (defaults to the label).
 */

export class QuickActionCard extends Element {
  icon = null;
  label = "";
  action = null;

  /** @param {QuickActionCardProps} props */
  constructor(props) {
    super();
    this.icon = props?.icon ?? null;
    this.label = props?.label ?? "";
    this.action = props?.action ?? null;
  }

  /** @returns {string|null} resolved icon URL (bare filenames resolve against this dir's img/) */
  iconSrc() {
    if (!this.icon) return null;
    return /[/\\]/.test(this.icon) ? this.icon : __DIR__ + "img/" + this.icon;
  }

  render() {
    return (
      <div styleset={__DIR__ + "QuickActionCard.css#quick-action-card"}>
        <div id="content" class="quick-action-card__content">
          {this.icon
            ? <div id="create-new-40px" class="quick-action-card__icon"
                   style={`foreground-image: url(${this.iconSrc()});`} />
            : []}
          <div id="card-name"
               class={"quick-action-card__label" + (this.icon ? "" : " quick-action-card__label--solo")}>
            {this.label}
          </div>
        </div>
      </div>
    );
  }

  // Interactivity: click-stub — no real behavior; announce the chosen action to the host view
  // as a bubbling custom event. The host decides what "Open PDF" etc. actually does.
  ["on click"]() {
    this.dispatchEvent(new Event("quick-action", { bubbles: true, data: this.action ?? this.label }));
    return true;
  }
}
