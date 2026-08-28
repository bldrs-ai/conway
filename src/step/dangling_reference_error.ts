/**
 * A reference field whose target express ID is not in the model's index.
 *
 * The step layer answers "this reference did not resolve" for two causes
 * that look identical at the throw site but are opposites for a caller
 * working a mid-parse PREFIX:
 *
 * - the referenced record is **absent from the index** — on a prefix that
 *   usually means "not scanned yet", so a longer prefix may resolve it;
 * - the referenced record **is** indexed but is the wrong entity type, or
 *   the field holds something that is not a reference at all — no amount
 *   of extra index changes that answer.
 *
 * Only the first is worth deferring and retrying. Both used to throw the
 * same bare `Error( 'Value in STEP was incorrectly typed' )`, so
 * `IfcGeometryExtraction.extractPlacementStrict_` tagged both as
 * {@link DanglingPlacementError} and the preview channels re-queued a
 * permanently broken placement on every generation — and, worse, its
 * presence in `deferredForRetry_` is what triggers early generation
 * PREEMPTION, so one malformed placement could keep paying for rebuilds
 * that could never satisfy it (conway#542, codex round 1 on #543).
 *
 * Deliberately minted in one place only — {@link unresolvedReferenceError}
 * below, which every reference-resolution failure path routes through. It
 * carries no fallback meaning, so a caller that does not care can keep
 * treating it as the `Error` it extends.
 *
 * The two causes above also want two different MESSAGES, which is what
 * `highestIndexedExpressID` selects (conway#580). Against a complete
 * index, "not in the index" is the truth and reads like the data defect
 * it is. Against a prefix it is a lie a human then spends time chasing:
 * the record may simply be ahead of the parse, and a truncated tail is
 * the expected steady state of the parse-time preview channel. The Arty
 * smoke reported four of these (#724209, #724211, #724213, #724215) as
 * data corruption; they were four ordinary prefix throws.
 *
 * The prefix message states two facts and composes nothing out of them:
 * this ID is absent from the prefix, and the highest ID indexed so far is
 * N. It deliberately does NOT say the prefix "covers #1-#N", because that
 * would be a second overclaim in place of the first one — express IDs are
 * not required to arrive in order (`StepIndexColumns.expressIdsSorted` is
 * a fact about a given file, not a guarantee; the preview tests move a
 * record to the tail precisely to exercise this), so a maximum of N is no
 * evidence that some smaller absent ID was ever scanned. Reporting it as
 * a range would turn a genuinely dangling reference in an unsorted prefix
 * into "not scanned yet" forever — false reassurance, which is worse than
 * the false alarm #580 started from. Codex round 1 on #586.
 */
export class DanglingReferenceError extends Error {
  /**
   * @param expressID The referenced record that did not resolve.
   * @param highestIndexedExpressID Highest express ID the index holds so
   * far, when the index is known to be an incomplete PREFIX (see
   * `StepModelBase.indexIsPrefix`). It is a maximum, NOT a scan boundary
   * — see the class doc. Omit it for a complete index: the absent case is
   * then a genuine dangling reference and gets the strong wording. Zero is
   * a meaningful value (an empty prefix), so the prefix form is selected
   * by presence, not truthiness.
   */
  constructor(
      public readonly expressID: number,
      public readonly highestIndexedExpressID?: number ) {

    super(
        highestIndexedExpressID === void 0 ?
          `Reference to #${expressID} is not in the index` :
          `Reference to #${expressID} is not present in this prefix index ` +
          `(highest indexed so far: #${highestIndexedExpressID})` )

    this.name = 'DanglingReferenceError'
  }
}


/**
 * The slice of a step model {@link unresolvedReferenceError} reads.
 *
 * Narrower than `StepModelBase` on purpose: this module is imported by the
 * step layer *and* by `IfcGeometryExtraction`, and taking the concrete
 * model type here would drag its whole generic parameter list — and a
 * cycle back through `step_entity_base` — into both.
 */
export interface UnresolvedReferenceModel {

  /**
   * @param expressID The referenced record.
   * @return {number | undefined} Its local ID, or undefined when the index
   * does not hold it.
   */
  resolveExpressID( expressID: number ): number | undefined

  /** Whether the index is known to be an incomplete prefix. */
  readonly indexIsPrefix: boolean

  /** Highest express ID the index holds. A maximum, not a scan boundary. */
  readonly maxIndexedExpressID: number
}

/**
 * What every untagged reference failure has said since before
 * {@link DanglingReferenceError} existed, and what the generated
 * single-valued and typed-array getters both throw for a mistyped entry.
 * Kept identical so classifying a path changes only the absent case.
 */
export const MISTYPED_VALUE_MESSAGE = 'Value in STEP was incorrectly typed'

/**
 * Classify a reference that failed to resolve.
 *
 * `getElementByExpressID` / `getTypedElementByExpressID` answer `undefined`
 * for two opposite causes: the record is not in the index at all, or it is
 * indexed but is the wrong entity type. A mid-parse prefix reader must tell
 * them apart — the first may resolve once more of the file is scanned, the
 * second never will — so the absent case gets its own error type (see
 * {@link DanglingReferenceError}). Called only on a throwing path, so
 * neither the extra index lookup nor the maximum-ID scan behind it costs
 * anything in the common case.
 *
 * Shared rather than duplicated because three call sites must agree on the
 * answer or the preview's retry queue goes wrong in one of two directions:
 * `StepEntityBase`'s scalar and reference-array extraction, and
 * `IfcGeometryExtraction.relatedProductByExpressID_`, which deliberately
 * mirrors what the generated array getter throws for the same entry.
 *
 * @param model The model whose index decides absence.
 * @param expressID The reference's target, or undefined when the field did
 * not hold a reference at all (an unresolved inline element).
 * @return {Error} The error to throw: `DanglingReferenceError` only when
 * the record is absent from the index, an untagged `Error` otherwise.
 */
export function unresolvedReferenceError(
    model: UnresolvedReferenceModel,
    expressID: number | undefined ): Error {

  if ( expressID !== void 0 && model.resolveExpressID( expressID ) === void 0 ) {

    // Hand the highest indexed ID over ONLY for a prefix index, so the
    // message can report absence-so-far instead of claiming the record is
    // missing from the file (conway#580). A complete model keeps the
    // absolute wording, because there the claim is true.
    return new DanglingReferenceError(
        expressID,
        model.indexIsPrefix ? model.maxIndexedExpressID : void 0 )
  }

  return new Error( MISTYPED_VALUE_MESSAGE )
}
