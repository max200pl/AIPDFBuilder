// tools/dev-bridge/unittest/storybook-states.test.js — the toolkit's generic behaviour spec, run by the storybook
// for EVERY unit (before the unit's own specs in <unit>/_debug/tests/storybook/*.test.js).
// TOOLKIT-OWNED (sciter-devtools `test init` / control channels ensure; regenerate, do not edit).
//
// A unit's state stories (Hover, MainDisabled, HoverFilled, "Type=Beta, State=Hover") are the design's answer to
// "what does this state look like". This spec turns them into tests of the live state, the way a web storybook's
// interaction tests do: for every state story with a base story (MainHover → MainDefault | Main | Default;
// HoverFilled → Filled) it selects the base, puts its root INTO the state for real through the engine's writable
// state flags (hover / active / focus / disabled — the flags drive the :hover / :active / :focus / :disabled rules),
// reads the computed state properties of the root and its descendants (by data-node, else by structural path), then selects the state story at
// rest and reads the same. Equal = the case passes (its note says how many properties the flag moved — evidence
// the flag bit). Different = the case fails naming the properties. A design root that carries a modifier the base
// lacks (.x--active, [aria-pressed]) marks the state as PROP-driven — an opened menu, a selected tab — which no
// flag can reach: the case passes with that note; the state itself is verified at rest by the story.
//
// Dialect: `test`, `testGroup`, `expect`, `$expect(selector)` (on the stage document), `$$expect`, `delay(ms)` and
// `story` — names() / pairs() / select(name) / root(selector) / $(selector) / setState(flag, on, selector) /
// styles(props, selector) / frame(n) / note(text) / expectState(base, flag, state, props, selector).

testGroup(story.component + " — the states the design draws are the states the engine renders", () => {
  for (const p of story.pairs()) {
    test(p.base + " +" + p.flag + " renders like " + p.state, async () => {
      await story.expectState(p.base, p.flag, p.state);
    });
  }
});
