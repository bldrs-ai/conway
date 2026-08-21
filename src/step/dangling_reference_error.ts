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
 */
export class DanglingReferenceError extends Error {
  /**
   * @param expressID The referenced record that is not in the index.
   */
  constructor( public readonly expressID: number ) {

    super( `Reference to #${expressID} is not in the index` )

    this.name = 'DanglingReferenceError'
  }
}
