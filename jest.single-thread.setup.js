// Jest `setupFiles` entry (see jest.config.ts): make every test file load the
// SINGLE-THREAD conway-geom wasm (`ConwayGeomWasmNode.js`) rather than
// `ConwayGeomWasmNodeMT.js`.
//
// Why: the MT glue is linked with -sPTHREAD_POOL_SIZE=<cpus - 1>
// (dependencies/conway-geom/genie.lua), so every ConwayGeometry.initialize()
// eagerly spawns that many worker_threads, and nothing ever terminates them
// (`PThread` is not an exported runtime method). A Jest worker initialises
// the module once per test file and serves many files, so the threads pile
// up, about 18-20 MB RSS each, outside the V8 heap. The full suite with
// coverage on then outgrows the box and gets SIGKILLed (bldrs-ai/conway#724;
// the real fix is bldrs-ai/conway#726).
//
// How it takes effect: loadWasmModule() in
// dependencies/conway-geom/interface/conway_geometry.ts calls
// pThreadsAllowed() on every initialize(), and that returns false when
// `process.env.FORCE_SINGLE_THREAD === 'true'`. The check reads
// `process.env` from inside the test's vm context, and a setupFile runs in
// that same context before the test file, so setting it here is early
// enough for every worker and file.
//
// Why a setupFile rather than the `test` script's environment: the setting
// is scoped to the Jest sandbox. Jest gives each test context its own copy
// of `process.env`, so it is not inherited by child processes a test spawns,
// by `yarn lint`, by the Tier A goldens, or by any benchmark, all of which
// must stay on the MT build. src/scripts/jest_wasm_thread_mode.test.ts pins
// that, and keeps one explicit MT initialisation in the suite.
//
// Opt out with an explicit value, for example
// `FORCE_SINGLE_THREAD=false yarn test` to run the suite against the MT build.
if (process.env.FORCE_SINGLE_THREAD === undefined) {
  process.env.FORCE_SINGLE_THREAD = 'true'
}
