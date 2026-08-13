# feedback_ssim_state_render

State-driven swap (any `js-src-swap` / `icon-prop` strategy chosen in the interactive step) needs
`this.componentUpdate()` after state mutation. Reactor will NOT auto-re-render on field
assignment. Symptom: first SSIM pass succeeds (default state correct), but clicking the active
item doesn't swap — second SSIM run shows DOM unchanged. Verify the event handler ends with
`componentUpdate()` BEFORE side effects (`navigate()`, etc.). See
`reference-sciter-icons.md#sciter-reactor-re-render-rule`.
