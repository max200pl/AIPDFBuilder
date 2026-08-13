// FeaturesRibbon.preview.js — CSF-style stories for sciter-devtools preview / storybook.
// Story width pinned to the design frame (1920dip); the component itself is width-fluid.
import { FeaturesRibbon } from "./FeaturesRibbon.js";

export const Default = () => (
  <div style="width: 1920dip">
    <FeaturesRibbon />
  </div>
);
