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
 * `indexHighWaterMark` selects (conway#580). Against a complete index,
 * "not in the index" is the truth and reads like the data defect it is.
 * Against a prefix it is a lie a human then spends time chasing: the
 * record is not missing, the parse simply has not reached it, and a
 * truncated tail is the expected steady state of the parse-time preview
 * channel. The Arty smoke reported four of these (#724209, #724211,
 * #724213, #724215) as data corruption; they were four ordinary prefix
 * throws.
 */
export class DanglingReferenceError extends Error {
  /**
   * @param expressID The referenced record that did not resolve.
   * @param indexHighWaterMark Highest express ID the index holds, when the
   * index is known to be an incomplete PREFIX (see
   * `StepModelBase.indexIsPrefix`). Omit it for a complete index — the
   * absent case is then a genuine dangling reference and gets the strong
   * wording. Zero is a meaningful value (an empty prefix), so the prefix
   * form is selected by presence, not truthiness.
   */
  constructor(
      public readonly expressID: number,
      public readonly indexHighWaterMark?: number ) {

    super(
        indexHighWaterMark === void 0 ?
          `Reference to #${expressID} is not in the index` :
          `Reference to #${expressID} has not been scanned yet ` +
          `(prefix index covers #1-#${indexHighWaterMark})` )

    this.name = 'DanglingReferenceError'
  }
}
