import ModelFormatDetector, {
  ModelFormatType,
} from '../../format_detection/model_format_detector'
import ParsingBuffer from '../../parsing/parsing_buffer'


/**
 * What a store-backed open (`IfcAPI.OpenModelStream` /
 * `OpenModelFromIndex`) needs of its store for a format (conway#757):
 *
 *  - `'any'` — IFC. Its extraction pages each read's record closure in
 *    asynchronously first, so any `StepExternalByteStore` will do;
 *  - `'synchronous'` — the AP214 family (AP214, and the AP203/AP242 files
 *    that open through it). Its extraction reads synchronously, so a
 *    windowed model faults its windows in and the store must offer
 *    `readSync`; over one that does not, the open is refused
 *    (`STORE_NOT_SYNCHRONOUS`).
 *
 * `undefined` for a format the store-backed open does not take.
 */
export type StoreOpenRequirement = 'any' | 'synchronous'


/**
 * The store requirement for a detected format — the one table both the
 * compat factory's store opens and an embedder's "store or buffer?"
 * decision read, so they cannot disagree.
 *
 * @param format The detected format.
 * @return {StoreOpenRequirement | undefined} The requirement, or undefined
 * when the store-backed open does not take the format.
 */
export function storeOpenRequirement(
    format: ModelFormatType | undefined ): StoreOpenRequirement | undefined {

  switch ( format ) {
    case ModelFormatType.IFC:
      return 'any'
    case ModelFormatType.AP214:
    case ModelFormatType.AP203:
    case ModelFormatType.AP242:
      return 'synchronous'
    default:
      return void 0
  }
}


/**
 * The store requirement for a file, from its prefix — conway's own
 * detector over the same bytes the store-backed open sniffs (its first
 * 64 KiB), so an embedder's answer comes from exactly what the open will
 * see. A prefix the detector cannot read, or that throws, reads as
 * undefined: buffer it.
 *
 * Share's Loader asks this before it decides whether to hand the engine a
 * File or bytes (Share#1776: a store open that refuses still consumes a
 * model handle, so a wrong "yes" on a shared IfcAPI misaddresses the
 * buffered retry).
 *
 * @param prefix The file's first bytes.
 * @return {StoreOpenRequirement | undefined} The requirement.
 */
export function storeOpenRequirementOf(
    prefix: Uint8Array ): StoreOpenRequirement | undefined {

  try {
    return storeOpenRequirement( ModelFormatDetector.detect( new ParsingBuffer( prefix ) ) )
  } catch {
    return void 0
  }
}
