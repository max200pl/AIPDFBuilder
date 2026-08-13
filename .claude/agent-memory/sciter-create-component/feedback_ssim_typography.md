# feedback_ssim_typography

`font:` shorthand fed a `var()` token is silently ignored in Sciter — build type ONLY through the
project's typography mixins (`@mixin name;` invocation form, no parens), never assemble `font:`
from CSS variables. In this project: `res/shared/lib/typography.css` (`@font-sm-medium;` etc.).
