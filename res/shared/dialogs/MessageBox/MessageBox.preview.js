// res/shared/dialogs/MessageBox/MessageBox.preview.js
// CSF-style story for the sciter-devtools preview / storybook harness.
//
// Dialog note: the root preview shim (res/.sdt-preview-shim.js) stubs Window.this.modal to hand
// the dialog body vnode straight back, so the single-export-inline factory renders headlessly
// (no real modal window opens during preview/storybook/SSIM capture).
import { ShowMessageBox } from "./MessageBox.js";

export const Default = () => ShowMessageBox();
