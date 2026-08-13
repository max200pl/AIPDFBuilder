# feedback_ssim_icon_in_flow

`<img>` icons inside `flow: vertical` (or any non-inline parent flow) default to inline-block in
Sciter — they ignore `content-horizontal-align: center` on the parent and `vertical-align: middle`
on themselves. Always set `display: block` on the icon `<img>` AND on its container when the icon
must center within a `flow: vertical` button/menu-item/nav-item. Symmetric to
feedback_ssim_display_block (which covers `<button>` containers) but for image children. SSIM
symptom: icon offset top-left, label below correct — diff highlights icon position, not size.
