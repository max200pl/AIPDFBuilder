// res/pages/Edit/Edit.js — Edit page view (registry type "page"), the main PDF-editing
// workspace. Figma: file 2jGq5p5qY4lsf5QK2stfOY, section node 15092:4589 ("Edit"), component
// node 15099:12998 ("Edit"), two side-by-side instances "Edit-Free user" (15099:13077) and
// "Edit-Pro user" (15100:13732). LAYOUT-FIRST: SystemRibbon + FeaturesRibbon + ToolsRibbon render
// once as a persistent chrome band; only the workspace canvas below varies with `plan`.
//
// Free/Pro is a ROLE axis (context/token scope per the project's axis-compile-map), not an R11
// lifecycle phase — no .Types.d.ts state union, just a `plan` prop.
//
// TODO(scope-gap): the Figma "Edit-Free user" instance adds a "Go Pro" button + "Soda PDF Free"
// title to SystemRibbon, and an "Activate now" CTA + view-mode toggle + search bar + share/support
// icons to FeaturesRibbon that the CURRENT SystemRibbon/FeaturesRibbon components do not render
// (P1 resolved both as wholesale REUSE — see the sciter-create-page P8 report's Shadow-parity
// section). This page renders with the reused, Pro-only chrome regardless of `plan` until those
// two components are extended in a follow-up build.

import { SystemRibbon } from "../../shared/components/SystemRibbon/SystemRibbon.js";
import { FeaturesRibbon } from "../../shared/components/FeaturesRibbon/FeaturesRibbon.js";
import { ToolsRibbon } from "../../shared/components/ToolsRibbon/ToolsRibbon.js";
import { TabDocRibbon } from "../../shared/components/TabDocRibbon/TabDocRibbon.js";
import { RightPanelTab } from "../../shared/components/RightPanelTab/RightPanelTab.js";
import { Page } from "../../shared/components/Page/Page.js";

/** @typedef {"free"|"pro"} EditPlan */

export class Edit extends Element {
  /** @type {EditPlan} */
  plan;

  /** @param {{ plan?: EditPlan, childView?: any }} [props] */
  constructor(props = {}) {
    super();
    // Defaults to "pro" — matches what SystemRibbon/FeaturesRibbon currently render (see the
    // TODO above); flip the default once those two components learn a Free-tier branch.
    this.plan = props.plan ?? "pro";
  }

  render() {
    return (
      <div class="edit" data-plan={this.plan} styleset={__DIR__ + "Edit.css#edit"}>
        <SystemRibbon />
        <FeaturesRibbon rightCluster={true} />
        <ToolsRibbon />
        <div id="main-content" class="edit__main-content">
          <TabDocRibbon />
          <div class="edit__canvas-row">
            <RightPanelTab side="left" />
            <div class="edit__canvas-center">
              <div class="edit__page-slot">
                <Page width={1094} height={812} />
              </div>
            </div>
            <RightPanelTab side="right" />
          </div>
        </div>
      </div>
    );
  }

  // Semantic-event sinks — child components bubble intents; unhandled ones stay kernel TODO.
  ["on tool-select"]() { /* TODO(kernel): dispatch the actual tool action (evt.data.action) */ return true; }
  ["on doc-tab-select"]() { /* TODO(kernel): switch the active open document */ return true; }
  ["on panel-tab-select"]() { /* TODO(kernel): open the corresponding side panel (e.g. bookmarks) */ return true; }
  ["on quick-action"]() { return true; }
  ["on feature-tab-select"]() { /* TODO(kernel): switch the active feature tab's tool ribbon */ return true; }
  ["on feature-action"]() { /* TODO(kernel): wire search/share/support/settings/activate */ return true; }
}
