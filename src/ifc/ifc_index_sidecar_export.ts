import {
  IFC_SIDECAR_SCHEMA,
  IndexSidecarUnsupportedError,
} from '../step/parsing/index_sidecar'
import {
  exportStepIndexSidecar,
  StepIndexSidecarExport,
  StepIndexSidecarExportOptions,
} from '../step/step_index_sidecar_export'
import IfcStepModel from './ifc_step_model'


/** What {@link exportIfcIndexSidecar} produced (the schema-neutral shape). */
export type IfcIndexSidecarExport = StepIndexSidecarExport


/** Options for {@link exportIfcIndexSidecar} (the schema-neutral shape). */
export type IfcIndexSidecarExportOptions = StepIndexSidecarExportOptions


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
 * per-record field masks (v3 has the slot, but the index-first open
 * refuses an IFC4X3 header, so such a sidecar could never be opened —
 * conway#758 wires that route); and one with no recorded hash when the
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
        'This model was opened through the IFC4-compatible IFC4X3 route; ' +
        'its field masks have a v3 slot, but the index-first open refuses ' +
        'IFC4X3 headers (conway#758), so its sidecar could never be ' +
        'opened; reopen it with a parse' )
  }

  return await exportStepIndexSidecar( model, IFC_SIDECAR_SCHEMA, options )
}
