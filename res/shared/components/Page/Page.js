// Page — the blank document-canvas placeholder behind the PDF viewport.
// Figma: file 2jGq5p5qY4lsf5QK2stfOY, node 15099:13086 ("Page", 1094×812).
// Conventions: .claude/docs/reference-component-creation-template.md (Element subclass,
// styleset via __DIR__, string-keyed event handlers). Purely decorative — stateless, no
// interactivity, no children markup: a single styled <div>.

/**
 * @typedef {Object} PageProps
 * @property {number} [width]  fixed width in dip; when omitted the root fills its container
 *                              (`width: *`) — pass the Figma value (1094) only to reproduce the
 *                              exact design size (e.g. in a preview story).
 * @property {number} [height] fixed height in dip; when omitted the root fills its container
 *                              (`height: *`) — pass the Figma value (812) only to reproduce the
 *                              exact design size (e.g. in a preview story).
 */

export class Page extends Element {
  width;
  height;

  /** @param {PageProps} [props] */
  constructor(props = {}) {
    super();
    this.width = props.width ?? null;
    this.height = props.height ?? null;
  }

  render() {
    const dim = (v) => (v != null ? `${v}dip` : "*");
    // Only override the CSS default (width:*; height:*; — fill the parent) when a caller
    // actually passed an explicit dimension; otherwise let the styleset's fill-sizing stand.
    const style =
      this.width != null || this.height != null
        ? `width:${dim(this.width)}; height:${dim(this.height)};`
        : undefined;
    return <div id="page" class="page" styleset={__DIR__ + "Page.css#page"} style={style} />;
  }
}
