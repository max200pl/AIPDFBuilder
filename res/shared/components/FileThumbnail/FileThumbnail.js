// FileThumbnail — one grid document tile: page preview above the file name.
// Figma: file 2jGq5p5qY4lsf5QK2stfOY, node 3698:16104 ("State=Default", 168×239).
// Conventions: .claude/docs/reference-component-creation-template.md (Element subclass,
// styleset via __DIR__, string-keyed event handlers).

/**
 * @typedef {Object} FileThumbnailProps
 * @property {string} name         file name shown under the preview
 * @property {string} [previewSrc] preview image URL; defaults to the bundled sample page
 */

export class FileThumbnail extends Element {
  name;
  previewSrc;

  /** @param {FileThumbnailProps} props */
  constructor(props) {
    super();
    this.name = props.name ?? "";
    this.previewSrc = props.previewSrc ?? __DIR__ + "img/preview-page.png";
  }

  render() {
    return (
      <div class="file-thumbnail" styleset={__DIR__ + "FileThumbnail.css#file-thumbnail"}>
        <div id="frame-53385" class="file-thumbnail__preview">
          <img id="preview-page" class="file-thumbnail__page" src={this.previewSrc} />
        </div>
        <div id="file-name-type" class="file-thumbnail__label-row">
          <div id="filename-long-pdf" class="file-thumbnail__name">{this.name}</div>
        </div>
      </div>
    );
  }

  // Click stub: announce activation as a bubbling custom event — no real behavior here.
  // Parents subscribe via ["on ^file-thumbnail-open"] (evt.data = { name }).
  ["on click"](evt, el) {
    this.postEvent(
      new Event("file-thumbnail-open", { bubbles: true, data: { name: this.name } })
    );
    return true;
  }
}
