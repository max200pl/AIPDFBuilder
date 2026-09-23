// VENDORED from the Sciter JS SDK samples.sciter/unit-test (toolkit-owned; sciter-devtools `test init` regenerates).

import {Expect} from "./unittest-expect.js";
import {TestError} from "./unittest-utils.js";

export let root = { name: "All", list:[] };
let parent = root;
let counter = 0;
let file = ""; // test file name

export function testSource(url) {
  file = url;
}
  
export function test(name,func) 
{ 
  parent.list.push({ name:name, run: func, id: "t" + (++counter), url:file, selected: true }); 
}

export function testGroup(name, func) 
{ 
  // group is a function that contains other unit test function declarations 
  let prevParent = parent;
  parent = { name:name, list: [], id: "t" + (++counter), url:file, selected: true };
  prevParent.list.push(parent);
  func();
  parent = prevParent;
}

export function expect(received) { 
  return new Expect(received);
}

export async function run(cbStart, cbEnd, cbGroupStart) {

  let fail = 0;
  let succ = 0;

  // VENDORED CHANGE (PDFCreator tests/dev): a non-TestError exception is reported through cbEnd
  // like a failure instead of a blocking Window.this.modal(<alert/>) — the runner is headless.
  async function runOne(test) {
    cbStart(test,succ,fail);
    try {
        await test.run(expect);
        ++succ;
        cbEnd(test, "");
    } catch(e) {
      ++fail;
      if(e instanceof TestError) cbEnd(test, e.message);
      else cbEnd(test, (e && e.message ? e.message : String(e)) + "\n" + (e && e.stack ? e.stack : ""));
    }
    return null;
  }

  async function runGroup(group) {
    cbGroupStart(group);
    for( let item of group.list ) {
      if(!item.selected) continue;
      if (item.list) await runGroup(item); else await runOne(item);
    }
    return null;
  }

  let r = await runGroup(root);
  return {fail,succ,error:r};
}

/** VENDORED ADDITION: forget the registered tests so one realm can run many spec files. */
export function reset() {
  root.list = [];
  parent = root;
  counter = 0;
  file = "";
}

// promisified timeout, returns promise
export function delay(ms) {
  return new Promise( resolve => setTimeout(resolve, ms));
}


