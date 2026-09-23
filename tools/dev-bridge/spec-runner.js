// tools/dev-bridge/spec-runner.js — runs a JS spec file INSIDE the live app window (bridge `runSpec`).
// TOOLKIT-OWNED (sciter-devtools `test init`; regenerate, do not edit).
//
// The spec dialect is the Sciter SDK unit-test module (./unittest, vendored): `test`, `testGroup`,
// `expect(v).equal(...) / .contain(...) / .greater(...) / .truthy()`, `$expect(selector).state("checked").on()
// / .click() / .attribute(name).equal(...)`, `$$expect`, `delay(ms)`, plus the page-level `page` object
// (./page.js): goto / route / routes / back / waitForRoute / setState / state / waitForState / phase / waitForPhase /
// setFixture / setRole / role / waitForSelector / box / node / $ (pointer verbs: click hover press release drag
// dragOver dropFiles — click / hover / press hit-test the element first) / hitTest / reset / behaviors.<kind> /
// screenshot / check.
//
// Isolation: `page.reset()` runs after EVERY case (and before the file) — the hover / press flags a case
// synthesised are released, so they cannot paint the next case's capture. The project's `adapter.reset()`
// (fixture + route) runs once per file, from the bridge's runSpec.
//
// A spec is plain script (not a module) — it is read from disk and evaluated inside a wrapper that
// injects the dialect, exactly like the SDK's own unittest.js does with fetch() + eval. Results come
// back as JSON: { ok, passed, failed, cases: [{ group, name, ok, message, ms }], route }.
import * as sys from "@sys";
import * as UnitTest from "./unittest/unittest-module.js";
import * as DOM from "./unittest/unittest-dom.js";
import { page } from "./page.js";

// Sciter.JS has no TextDecoder — decode UTF-8 by hand so spec names/messages with non-ASCII text
// (arrows, Cyrillic) survive the round-trip instead of turning into Latin-1 mojibake.
function readText(nativePath) {
  const b = new Uint8Array(sys.fs.$readfile(nativePath));
  let s = "";
  for (let i = 0; i < b.length;) {
    const c = b[i];
    if (c < 0x80) { s += String.fromCharCode(c); i += 1; }
    else if (c < 0xe0) { s += String.fromCharCode(((c & 0x1f) << 6) | (b[i + 1] & 0x3f)); i += 2; }
    else if (c < 0xf0) { s += String.fromCharCode(((c & 0x0f) << 12) | ((b[i + 1] & 0x3f) << 6) | (b[i + 2] & 0x3f)); i += 3; }
    else {
      const cp = ((c & 0x07) << 18) | ((b[i + 1] & 0x3f) << 12) | ((b[i + 2] & 0x3f) << 6) | (b[i + 3] & 0x3f);
      s += String.fromCodePoint(cp); i += 4;
    }
  }
  return s;
}

/**
 * @param {string} path native path of the spec file
 * @param {{root: Element}} ctx
 */
export async function runSpec(path, ctx) {
  let source;
  try { source = readText(path); } catch (e) { return { ok: false, error: `cannot read spec '${path}': ${e?.message || e}` }; }

  UnitTest.reset();
  UnitTest.testSource(path);
  try {
    const wrapper = eval("(function(test, testGroup, expect, $expect, $$expect, page, delay){" + source + "\n})");
    wrapper(UnitTest.test, UnitTest.testGroup, UnitTest.expect, DOM.ExpectedElement, DOM.ExpectedElements, page, UnitTest.delay);
  } catch (e) {
    return { ok: false, error: `spec '${path}' failed to load: ${e?.message || e}`, stack: String(e?.stack || "") };
  }

  const cases = [];
  const groups = [];
  let started = 0;
  const cbGroupStart = (g) => { if (g !== UnitTest.root) groups.push(g.name); };
  const cbStart = () => { started = Date.now(); };
  const cbEnd = (t, message) => {
    cases.push({ group: groups[groups.length - 1] ?? "", name: t.name, ok: !message, message: message || "", ms: Date.now() - started });
    try { page.reset(); } catch (_) {}     // per-case: release the pointer flags this case synthesised
  };
  try { page.reset(); } catch (_) {}
  const r = await UnitTest.run(cbStart, cbEnd, cbGroupStart);
  return { ok: r.fail === 0, passed: r.succ, failed: r.fail, cases, route: page.route() };
}
