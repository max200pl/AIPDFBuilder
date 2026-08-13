# feedback_ssim_display_block

`<button>` is `inline-block` by default in Sciter (descender gap + ignores `content-*-align`).
For a single-element text button (font + fixed `height` on the `<button>` itself), `inline-block`
is fine AND codebase-idiomatic — but you MUST emit `vertical-align: middle` up-front: it centers
the label in the fixed height and kills the gap. Use `display: block` only for a full-width column
button. The linter accepts `inline-block` for `<button>`; emit the centering proactively, never
reactively after lint.
