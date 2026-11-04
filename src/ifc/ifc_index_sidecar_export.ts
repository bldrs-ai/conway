import {
  IndexSidecarUnsupportedError,
  serializeIndexSidecarFromColumns,
} from '../step/parsing/index_sidecar'
import IfcStepModel from './ifc_step_model'


/**
 * What {@link exportIfcIndexSidecar} produced, with what it cost.
 */
export interface IfcIndexSidecarExport {

  /** The v2 sidecar bytes (`index_sidecar.ts`). */
  sidecar: Uint8Array

  /** The length of the source the sidecar was written against. */
  sourceByteLength: number

  /** The FNV-1a of that source, as recorded in the sidecar's header. */
  sourceHash: number

  /** Milliseconds spent serialising the columns. */
  serializeMs: number
}


/**
 * Options for {@link exportIfcIndexSidecar}.
 */
export interface IfcIndexSidecarExportOptions {

  /**
   * The source's hash, for a model whose open did not record one
   * (`StepModelBase.indexedSourceHash` unset — a model built outside the
   * IFC open entry points). Ignored when the model has its own. **Must** be
   * the FNV-1a (`hashSource`) of exactly the bytes the model's index was
   * built from; a wrong value writes a sidecar that every verified open
   * will refuse as stale, and that a length-only open will trust.
   */
  sourceHash?: number
}


/**
 * Write the index sidecar for an IFC model that is already open
 * (conway#756), so a later engine can come up with `openIfcModelFromIndex`
 * / `IfcAPI.OpenModelFromIndex` instead of re-parsing the source.
 *
 * Works for every way an IFC model is opened — resident (object or columnar
 * parse), windowed from birth over a store, spilled after a resident open,
 * or itself opened from a sidecar — because both inputs come from the model,
 * and both describe the same bytes:
 *
 *  - **the index** is the model's own columns
 *    (`StepModelBase.indexColumns`), which are byte-for-byte the columns the
 *    parse produced, so the blob equals one serialised off the parse;
 *  - **the hash** is the one the OPEN recorded
 *    (`StepModelBase.indexedSourceHash`): folded into the streaming parse's
 *    own pass, or taken over the resident buffer the classic parse read.
 *    Recording it is opt-in (`RECORD_SOURCE_HASH` / `recordSourceHash`):
 *    it costs ~12 % of the index build, and most opens never export.
 *
 * The hash is deliberately NOT re-derived from the source at export time
 * (codex review of conway#760). The index describes the bytes that were
 * parsed; hashing whatever the source holds now would bind those offsets
 * to a resident buffer mutated after open, or to a same-length store
 * swapped in by `SpillModelSource`, and a verified reopen over the new
 * bytes would then accept an index that addresses the old ones. With the
 * parse-time hash, that reopen is refused as stale. It also makes the
 * export itself a serialise — no read of the source at all.
 *
 * Refuses, with an {@link IndexSidecarUnsupportedError}, a model the format
 * cannot represent: one on the IFC4-compatible IFC4X3 route, whose
 * per-record field masks v2 has no slot for (and whose header the
 * index-first open refuses anyway); and one with no recorded hash when the
 * caller supplies none. Refuses a mid-parse prefix model through the
 * serialiser's own guard.
 *
 * @param model The open model.
 * @param options See {@link IfcIndexSidecarExportOptions}.
 * @return {Promise<IfcIndexSidecarExport>} The sidecar, its identity, and
 * its cost.
 */
export async function exportIfcIndexSidecar(
    model: IfcStepModel,
    options?: IfcIndexSidecarExportOptions ): Promise<IfcIndexSidecarExport> {

  if ( model.hasFieldMasks ) {
    throw new IndexSidecarUnsupportedError(
        'This model was opened through the IFC4-compatible IFC4X3 route, ' +
        'whose per-record field masks the v2 index sidecar cannot carry; ' +
        'reopen it with a parse' )
  }

  const sourceByteLength = model.bufferBytesize
  const sourceHash = model.indexedSourceHash ?? options?.sourceHash

  if ( sourceHash === void 0 ) {
    throw new IndexSidecarUnsupportedError(
        'This model\'s open recorded no hash of the bytes its index was ' +
        'built from (StepModelBase.indexedSourceHash) — open it with ' +
        'RECORD_SOURCE_HASH (compat) or recordSourceHash (engine) — and ' +
        'none was supplied; hashing the source now could bind the index to ' +
        'bytes it does not describe' )
  }

  const serializeStart = Date.now()

  const sidecar = serializeIndexSidecarFromColumns(
      model.indexColumns(), sourceByteLength, sourceHash )

  const serializeMs = Date.now() - serializeStart

  return {
    sidecar,
    sourceByteLength,
    sourceHash: sourceHash >>> 0,
    serializeMs,
  }
}
