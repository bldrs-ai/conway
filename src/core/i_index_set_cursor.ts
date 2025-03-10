/**
 * General interface for a index set cursor.
 */
export interface IIndexSetCursor {
  /**
   * The high bits of the current value (bottom 5 bits masked out)
   */
  high: number

  /**
   * The low bits of the current value, represnted as a unioned one-hot, where bit position
   * corresponds to a low 5 bits to be combined with high.
   *
   * This means a particular combination of high and low can represent up to 32 values over
   * the range 0->31 for the "high" value.
   */
  low: number

  /**
   * Step this forwards to the next "high" value and its corresponding low. This allows lazy
   * iteration through the cursor.
   * @returns False if the sequence has ended, true otherwise.
   */
  step(): boolean

  /**
   * For cursors that are pooled, send this cursor back to the pool (it's safe to leave it
   * up to the garbage collector if you don't wish to use pooling)
   */
  free(): void
}
