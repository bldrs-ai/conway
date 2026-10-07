/**
 * Refuse to measure geometry against a WASM build that does not correspond to
 * the conway-geom source this checkout has.
 *
 * This is the call site the check exists for. The debug scripts' whole job is
 * to produce numbers that get quoted in issues, PR descriptions and commit
 * messages, and a stale `Dist/` makes those numbers describe an engine nobody
 * is reading. That is not hypothetical: in Sep 2026 `face_health.mjs` reported
 * `ADVANCED_FACE #18856` still carrying its pre-conway-geom#214 fold, against
 * a checkout whose submodule already had the fix — a closed defect read as
 * live, and the reader had no signal at all. See scripts/wasmProvenance.cjs.
 *
 * Set `CONWAY_ALLOW_STALE_WASM=1` to downgrade this to a warning, for the one
 * legitimate case: deliberately measuring an OLD engine (an A/B against a
 * previous pin). It prints what it is letting through, so a transcript of such
 * a run still says which engine produced the numbers.
 */
import {createRequire} from 'node:module'

const require = createRequire(import.meta.url)
const {GATED_TARGET, inspect} = require('../wasmProvenance.cjs')

/**
 * @param {string} toolName shown in the message, so the failure names the
 *   script the reader actually ran.
 * @return {void} exits the process on a stale build.
 */
export function assertWasmFresh(toolName) {
  // The probes import NodeMT only. Jest's single-thread Node variant is not
  // theirs to gate on: after `build-codex-MT` refreshes NodeMT, a stale Node
  // must not exit 3 here (codex review, conway#727). `check-wasm-fresh` and
  // `precommit` still check both.
  const {status, fatal, message, remedy, warnings} = inspect({targets: [GATED_TARGET]})

  for (const warning of warnings) {
    console.warn(`[${toolName}] note: ${warning}`)
  }

  if (status === 'ok') {
    return
  }

  // Only a SHA mismatch blocks. A dirty tree or an unstamped bundle is
  // reported and allowed through: those readings are approximate (see
  // wasmProvenance.cjs) and refusing on them stops real debugging.
  const blocking = fatal && process.env.CONWAY_ALLOW_STALE_WASM !== '1'

  console.error(`[${toolName}] ${blocking ? 'ERROR' : 'WARNING'}: ${message}`)

  if (remedy !== null) {
    console.error(`[${toolName}] fix: ${remedy}`)
  }

  if (blocking) {
    console.error(`[${toolName}] measurements from a mismatched engine describe ` +
      'code you are not reading. Set CONWAY_ALLOW_STALE_WASM=1 if that is deliberate.')
    process.exit(3)
  }
}
