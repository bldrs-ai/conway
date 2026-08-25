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
 * Deliberately thrown only from the reference-resolution failure paths in
 * `StepEntityBase`; it carries no fallback meaning, so a caller that does
 * not care can keep treating it as the `Error` it extends.
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
