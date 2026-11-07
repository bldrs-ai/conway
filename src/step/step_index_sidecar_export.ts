import {
  IndexSidecarUnsupportedError,
  serializeIndexSidecarFromColumns,
  SidecarSchemaStamp,
} from './parsing/index_sidecar'
import StepModelBase from './step_model_base'


/**
 * What {@link exportStepIndexSidecar} produced, with what it cost.
 */
export interface StepIndexSidecarExport {

  /** The sidecar bytes (`index_sidecar.ts`). */
  sidecar: Uint8Array

  /** The length of the source the sidecar was written against. */
  sourceByteLength: number

  /** The FNV-1a of that source, as recorded in the sidecar's header. */
  sourceHash: number

  /** Milliseconds spent serialising the columns. */
  serializeMs: number
}


/**
 * Options for {@link exportStepIndexSidecar}.
 */
export interface StepIndexSidecarExportOptions {

  /**
   * The source's hash, for a model whose open did not record one
   * (`StepModelBase.indexedSourceHash` unset — a model built outside the
   * open entry points). Ignored when the model has its own. **Must** be
   * the FNV-1a (`hashSource`) of exactly the bytes the model's index was
   * built from; a wrong value writes a sidecar that every verified open
   * will refuse as stale, and that a length-only open will trust.
   */
  sourceHash?: number
}


/**
 * Write the index sidecar for a model that is already open, of any schema
 * the sidecar has a stamp for (conway#756 for IFC, conway#757 for AP214):
 * the model's own columns (`StepModelBase.indexColumns`), the hashes its
 * open recorded (`indexedSourceHash`, `indexedSampledHash`), and the
 * schema stamp the caller names — the one fact about the model the columns
 * do not carry. `exportIfcIndexSidecar` and the AP214 proxy's
 * `exportIndexSidecar` are this with their schema's stamp; see the IFC one
 * for why the hash is the open's rather than one taken now.
 *
 * Refuses, with an {@link IndexSidecarUnsupportedError}, a model with no
 * recorded hash when the caller supplies none. A model whose open recorded
 * a whole-source hash but no sampled one (a caller-supplied hash) writes
 * the sampled slot empty, and a sampled verify of it then runs the full
 * check.
 *
 * @param model The open model.
 * @param schema The stamp of the enumeration the model's `typeID`s index.
 * @param options See {@link StepIndexSidecarExportOptions}.
 * @return {Promise<StepIndexSidecarExport>} The sidecar, its identity, and
 * its cost.
 */
export async function exportStepIndexSidecar< TypeIDType extends number >(
    model: StepModelBase< TypeIDType >,
    schema: SidecarSchemaStamp,
    options?: StepIndexSidecarExportOptions ): Promise< StepIndexSidecarExport > {

  const sourceByteLength = model.bufferBytesize
  const recorded = model.indexedSourceHash
  const sourceHash = recorded ?? options?.sourceHash

  if ( sourceHash === void 0 ) {
    throw new IndexSidecarUnsupportedError(
        'This model\'s open recorded no hash of the bytes its index was ' +
        'built from (StepModelBase.indexedSourceHash) — open it with ' +
        'RECORD_SOURCE_HASH (compat) or recordSourceHash (engine) — and ' +
        'none was supplied; hashing the source now could bind the index to ' +
        'bytes it does not describe' )
  }

  const serializeStart = Date.now()

  // The sampled digest only rides with the open's own whole-source hash: a
  // caller-supplied hash says nothing about which bytes were sampled.
  const sidecar = serializeIndexSidecarFromColumns(
      model.indexColumns(), sourceByteLength, sourceHash, {
        schema,
        sampledHash: recorded !== void 0 ? model.indexedSampledHash : void 0,
      } )

  const serializeMs = Date.now() - serializeStart

  return {
    sidecar,
    sourceByteLength,
    sourceHash: sourceHash >>> 0,
    serializeMs,
  }
}
