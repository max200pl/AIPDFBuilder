# feedback_ssim_centering

`content-align` on a parent is ignored when a child uses `width: *` — use `vertical-align: middle`
on each child instead. Also: children of a content-aligned container align as ONE shrink-wrapped
block, never individually; and `content-horizontal-align` + horizontal padding anchors the
centered child at the border-box origin (symmetric padding is safe, asymmetric is not — use child
margins for asymmetric positioning).
