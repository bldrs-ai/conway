import {
  IndexSidecarUnsupportedError,
  serializeIndexSidecarFromColumns,
} from '../step/parsing/index_sidecar'
import { hashSourceAsync } from '../step/parsing/source_hash'
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

  /** Milliseconds spent hashing the source (0 when a hash was supplied). */
  hashMs: number

  /** Milliseconds spent serialising the columns. */
  serializeMs: number
}


/**
 * Options for {@link exportIfcIndexSidecar}.
 */
export interface IfcIndexSidecarExportOptions {

  /**
   * The source's hash, when the caller already has it — an earlier export
   * of the same model, or a parse that folded it in through
   * `HashingByteSource`. Skips the whole-source pass, which is most of an
   * export's cost. **Must** be the FNV-1a of exactly this model's source
   * (`hashSource`); a wrong value writes a sidecar that every verified open
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
 * or itself opened from a sidecar — because both inputs come from the model:
 *
 *  - **the index** is the model's own columns
 *    (`StepModelBase.indexColumns`), which are byte-for-byte the columns the
 *    parse produced, so the blob equals one serialised off the parse;
 *  - **the hash** is a chunked FNV-1a over the model's own source
 *    (`StepModelBase.sourceReader` — the resident buffer, or the store the
 *    model pages from), read around the windowed LRU so it does not evict
 *    what a geometry pump is using, and yielding between chunks.
 *
 * The hash is taken HERE, after the load, rather than folded into the
 * parse. The export is meant to run once the load has settled, off its
 * critical path; folding it in would put ~1.5 s per 900 MB onto every
 * parse to serve the minority of models that are later evicted. What that
 * trades away is the guarantee that the bytes hashed are the bytes parsed:
 * a source rewritten in place between the two would be recorded under the
 * new file's hash. The model is already reading those bytes for every
 * demand page-in, so it is equally wrong either way; the embedder's store
 * is expected not to change under an open model.
 *
 * Refuses, with an {@link IndexSidecarUnsupportedError}, a model the format
 * cannot represent: one on the IFC4-compatible IFC4X3 route, whose
 * per-record field masks v2 has no slot for (and whose header the
 * index-first open refuses anyway). Refuses a mid-parse prefix model through
 * the serialiser's own guard.
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

  let sourceHash = options?.sourceHash
  let hashMs = 0

  if ( sourceHash === void 0 ) {

    const reader = model.sourceReader()

    if ( reader === void 0 ) {
      throw new IndexSidecarUnsupportedError(
          'This model\'s source is neither resident nor store-backed, so ' +
          'there is nothing to hash for the sidecar\'s trust gate' )
    }

    const hashStart = Date.now()

    sourceHash = await hashSourceAsync( reader )
    hashMs = Date.now() - hashStart
  }

  const serializeStart = Date.now()

  const sidecar = serializeIndexSidecarFromColumns(
      model.indexColumns(), sourceByteLength, sourceHash )

  const serializeMs = Date.now() - serializeStart

  return {
    sidecar,
    sourceByteLength,
    sourceHash: sourceHash >>> 0,
    hashMs,
    serializeMs,
  }
}
