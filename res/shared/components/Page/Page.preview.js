// Preview stories for sciter-devtools preview/storybook (CSF-style named exports).
// Not part of the app build. Story renders the design's exact 1094×812 box so SSIM/Gate-1
// compare against the Figma reference at 1:1 scale.
import { Page } from "./Page.js";

export const Default = () => <Page width={1094} height={812} />;
