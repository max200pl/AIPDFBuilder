// FileListRow preview stories — CSF-style named exports consumed by sciter-devtools
// preview/storybook (`--story Default`). The wrapper pins the page-contract story width
// (1128dip, the width the SSIM reference was produced at); the row itself is fluid (width:*).
import { FileListRow } from "./FileListRow.js";

export const Default = () => (
  <div style="width: 1128dip; height: 80dip;">
    <FileListRow
      name={"File Sample Name "}
      path={"C:\\Users\\AmazingUser\\Documents\\Invoice23456.pdf"} />
  </div>
);
