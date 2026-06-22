// Empty stub for Node-only builtins so browser bundles of emscripten modules
// (e.g. @neslinesli93/qpdf-wasm) can be imported without resolving `fs`/`path`.
// The emscripten code guards these requires behind `typeof process.versions.node`,
// so they are never actually called in the browser.
const nodeStub = {};
export default nodeStub;
