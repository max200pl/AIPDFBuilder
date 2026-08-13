// .claude/state/layout-matrix.preview.js
// Doc-driven layout matrix — assembled by /calibrate-building-process (Step 4.7) from THIS
// project's documented build idioms; rendered + assessed by `sciter-devtools calibrate`
// (--probes all) into calibration.json's `layout` block + a human-legible layout-matrix.png.
//
// Idiom sources (never invented — see layout-matrix.css header for the full list):
// - component shape + styleset form: .claude/docs/reference-component-creation-template.md
// - group centering via content-*-align on a <div> root: PrimaryButton.css
// - spring-margin positioning (`margin-*: *`): QuickActionCard.css
// - engine quirks honored: .claude/agent-memory/sciter-create-component/feedback_ssim_*.md
//
// No app-shell globals to stub — res/.sdt-preview-shim.js confirms none exist in this project.
//
// GROWING POSITIONING MEMORY: when a build surfaces a NEW positioning defect, add a labelled
// case here (the EmptyState bundle is the seed pattern) so it is re-verified on every
// calibration instead of re-discovered mid-feature.

const CSS_URL = __DIR__ + "layout-matrix.css#layout-matrix";
const ICON = __DIR__ + "../../res/shared/components/FileListRow/img/doc-icon.svg";

const H = [["l", "left"], ["c", "center"], ["r", "right"]];
const V = [["t", "top"], ["m", "middle"], ["b", "bottom"]];

// One labelled 3x3-grid case: a fixed cell (lay-<h><v>-cell) holding a small box (lay-<h><v>)
// positioned by that combo via the spring-margin idiom (classes h-*/v-* in layout-matrix.css).
function AlignCase({ h, hName, v, vName }) {
  return (
    <div class="matrix__case">
      <div class="matrix__caption">{`h:${hName} v:${vName}`}</div>
      <div id={`lay-${h}${v}-cell`} class="matrix__cell">
        <div id={`lay-${h}${v}`} class={`matrix__box h-${h} v-${v}`} />
      </div>
    </div>
  );
}

export const Default = () => (
  <div styleset={CSS_URL}>
    <div class="matrix__title">layout-matrix — doc-driven positioning calibration</div>
    {V.map(([v, vName]) => (
      <div class="matrix__row" key={v}>
        {H.map(([h, hName]) => (
          <AlignCase key={h + v} h={h} hName={hName} v={v} vName={vName} />
        ))}
      </div>
    ))}
    <div class="matrix__row">
      <div class="matrix__case">
        <div class="matrix__caption">EmptyState bundle (shared centre)</div>
        <div class="matrix__empty-cell">
          <div id="lay-illus" class="matrix__illus" />
          <div id="lay-caption" class="matrix__empty-caption">wider caption under one centre</div>
        </div>
      </div>
      <div class="matrix__case">
        <div class="matrix__caption">button icon+text</div>
        <div id="lay-btn" class="matrix__btn">
          <img id="lay-btn-icon" class="matrix__btn-icon" src={ICON} />
          <div id="lay-btn-text" class="matrix__btn-text">Label</div>
        </div>
      </div>
      <div class="matrix__case">
        <div class="matrix__caption">two buttons</div>
        <div class="matrix__btnrow">
          <div id="lay-btnrow-a" class="matrix__btn matrix__btn--small">
            <div class="matrix__btn-text">A</div>
          </div>
          <div id="lay-btnrow-b" class="matrix__btn matrix__btn--small matrix__btn--b">
            <div class="matrix__btn-text">B</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
