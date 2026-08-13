# feedback_ssim_styleset_root

Verified on scapp 5.0.3.21 (AIPDFBuilder, 2026-08-12 wave — PrimaryButton + SortBy):

1. **Bare declarations directly inside a `@set` block are SILENTLY DROPPED.** Root-element styles
   must be wrapped in `:root { ... }` inside the `@set`. Symptom: nested child selector rules
   apply (text color/size correct) while the root has no background/height/centering — a
   dark-bg button renders as white label on white window = a 100% uniform frame that the
   capture-validity check misreports as "environment class". Always emit
   `@set name { :root { ... } .block__child { ... } }`.

2. **Sciter renders content-box; a declared `box-sizing: border-box` did NOT take effect**
   (Gate-1: +6 y-shift + 6-unit bottom overflow with height 40 + padding 6). Do not put padding
   on a fixed-height styleset root — carry the design padding as margins on the centered child.

3. **Native `<button>` fights styleset styling**: its UA face paints over the background and its
   caption layout ignores `content-*-align` and child star margins. Project convention: `<div>`
   root + `["on click"]` handler (see SortBy / PrimaryButton).
