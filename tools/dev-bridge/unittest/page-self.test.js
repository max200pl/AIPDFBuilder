// tools/dev-bridge/unittest/page-self.test.js — the harness's OWN contract, run FIRST by every `test run`.
// TOOLKIT-OWNED (sciter-devtools `test init`; regenerate, do not edit).
//
// What it proves, in the live window, before any project spec runs: the pointer verbs of page.js reach the
// binding idiom the project documents — a delegated class handler `["on <event> at <selector>"]` on an
// ANCESTOR fires for page.$(sel).click() / hover() / press() on the target element, because every verb
// dispatches FROM the resolved element with `bubbles: true` (click() is the engine's own Element.click())
// and press() carries the `buttons` mask. A view therefore never rebinds `el.on(...)` after render to be
// testable: when synthesised input cannot reach the documented idiom, THIS file goes red and the harness is
// fixed — never the production binding (structural-lint `post-in-render`).
//
// It also locks the refusals that keep a case red for the right reason: a covered element is refused
// naming the cover (`{ force: true }` acts anyway), a plain <div> without a clickable behavior is refused,
// and page.reset() releases every hover / active flag a verb set.
//
// Dialect: the spec-runner's (plain script — `test`, `testGroup`, `expect`, `$expect`, `page`, `delay`).
// The probe host is mounted through the engine's JSX() factory (what a JSX literal compiles to), so the
// file needs no JSX syntax and no module import; it is removed after every case.

testGroup("page-self — the dev bridge reaches the project's binding idiom", () => {
  const SEEN = [];
  const HOST_STYLE = "position:fixed; left:0; top:0; z-index:100000; width:260dip; height:120dip; background:#ffffff;";
  const box = (left, top) => `position:absolute; left:${left}dip; top:${top}dip; width:100dip; height:32dip;`;

  class SdtPageSelfHost extends Element {
    render() {
      return JSX("div", { class: "sdt-page-self", style: HOST_STYLE }, [
        JSX("button", { class: "probe", style: box(8, 8) }, ["probe"]),
        JSX("div", { class: "plain", style: box(8, 48) }, ["plain"]),
        JSX("button", { class: "under", style: box(130, 8) }, ["under"]),
        // a cover WITHOUT a clickable behavior over `.under` — the freeze-class shape (an inert layer swallows
        // the real pointer while Element.click() would still be delivered underneath)
        JSX("div", { class: "cover", style: "position:absolute; left:120dip; top:0; width:140dip; height:120dip; background:#ffffff;" }, []),
      ]);
    }
    ["on click at .probe"](evt, probe) { SEEN.push({ type: "click", delegated: probe === evt.target, target: evt.target?.attributes?.["class"] ?? null }); }
    ["on click at .under"](evt) { SEEN.push({ type: "click-under", target: evt.target?.attributes?.["class"] ?? null }); }
    ["on mouseenter at .probe"](evt) { SEEN.push({ type: "mouseenter", target: evt.target?.attributes?.["class"] ?? null }); }
    ["on mouseover at .probe"](evt) { SEEN.push({ type: "mouseover", target: evt.target?.attributes?.["class"] ?? null }); }
    ["on mouseleave at .probe"](evt) { SEEN.push({ type: "mouseleave" }); }
    ["on mousedown at .probe"](evt) { SEEN.push({ type: "mousedown", buttons: evt.buttons, button: evt.button }); }
    ["on mouseup at .probe"](evt) { SEEN.push({ type: "mouseup", buttons: evt.buttons }); }
  }

  const types = () => SEEN.map((s) => s.type);
  const errorText = (e) => String(e && (e.message ?? e.text ?? e));

  async function mounted(run) {
    SEEN.length = 0;
    document.body.append(JSX(SdtPageSelfHost, {}, []));
    const host = document.$(".sdt-page-self");
    if (!host) throw new Error("page-self: probe host did not mount");
    try {
      await page.frame();
      await run(host);
    } finally {
      try { page.reset(); } catch (_) {}
      try { host.remove(); } catch (_) {}
    }
  }

  test("click(): a delegated [\"on click at .probe\"] ancestor handler fires; evt.target is the probe", async () => {
    await mounted(async () => {
      page.$(".sdt-page-self .probe").click();
      await delay(60);                                     // Element.click() posts the event (async) for clickable behaviors
      expect(types().includes("click")).equal(true);
      const hit = SEEN.find((s) => s.type === "click");
      expect(hit.delegated).equal(true);
      expect(hit.target).equal("probe");
    });
  });

  test("hover(): delegated mouseenter / mouseover reach the ancestor and :hover follows; unhover() releases", async () => {
    await mounted(async () => {
      const probe = document.$(".sdt-page-self .probe");
      page.$(".sdt-page-self .probe").hover();
      expect(types().includes("mouseenter")).equal(true);
      expect(types().includes("mouseover")).equal(true);
      expect(SEEN.find((s) => s.type === "mouseenter").target).equal("probe");
      expect(!!probe.state.hover).equal(true);
      page.$(".sdt-page-self .probe").unhover();
      expect(types().includes("mouseleave")).equal(true);
      expect(!!probe.state.hover).equal(false);
    });
  });

  test("press(): the delegated mousedown carries the left buttons mask and :active follows; release() sends mouseup with 0", async () => {
    await mounted(async () => {
      const probe = document.$(".sdt-page-self .probe");
      page.$(".sdt-page-self .probe").press();
      const down = SEEN.find((s) => s.type === "mousedown");
      expect(!!down).equal(true);
      expect(down.buttons).equal(1);                       // the engine derives evt.button from the mask too (left reads 1)
      expect(!!probe.state.active).equal(true);
      page.$(".sdt-page-self .probe").release();
      const up = SEEN.find((s) => s.type === "mouseup");
      expect(!!up).equal(true);
      expect(up.buttons).equal(0);
      expect(!!probe.state.active).equal(false);
    });
  });

  test("a covered element is refused naming the cover; { force: true } acts on it deliberately", async () => {
    await mounted(async () => {
      let refused = "";
      try { page.$(".sdt-page-self .under").click(); } catch (e) { refused = errorText(e); }
      expect(refused.includes("occluded by")).equal(true);
      expect(refused.includes("cover")).equal(true);
      expect(types().includes("click-under")).equal(false);
      page.$(".sdt-page-self .under").click({ force: true });
      await delay(60);
      expect(types().includes("click-under")).equal(true);
    });
  });

  test("a plain <div> without a clickable behavior is refused by click()", async () => {
    await mounted(async () => {
      let refused = "";
      try { page.$(".sdt-page-self .plain").click(); } catch (e) { refused = errorText(e); }
      expect(refused.includes("not clickable")).equal(true);
    });
  });

  test("page.reset() releases the hover / active flags the verbs set", async () => {
    await mounted(async () => {
      const probe = document.$(".sdt-page-self .probe");
      page.$(".sdt-page-self .probe").press();
      expect(!!probe.state.active && !!probe.state.hover).equal(true);
      const released = page.reset();
      expect(released >= 1).equal(true);
      expect(!!probe.state.active).equal(false);
      expect(!!probe.state.hover).equal(false);
    });
  });
});
