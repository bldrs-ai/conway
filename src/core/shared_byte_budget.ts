/**
 * A byte budget shared across many models (M5 / design S3).
 *
 * The federation invariant: budgets must be **per browser, not per model**, or
 * opening N cross-referenced files re-introduces O(N) memory. This is the one
 * accounting primitive that enforces it — every model's demand-geometry queue
 * and window pool draws from a single {@link SharedByteBudget}, so the total
 * resident footprint across all open models is bounded no matter how many are
 * federated in.
 *
 * It owns only the accounting (reserve / release / availability); the eviction
 * policy that frees bytes when a reservation can't be met stays with each
 * model's scheduler (M3's {@link DemandGeometryQueue}) — the budget just tells
 * a caller how much it must evict first via {@link overageFor}.
 */
export class SharedByteBudget {

  private used_ = 0

  /**
   * @param totalBytes_ The global ceiling shared across all models.
   */
  constructor( private readonly totalBytes_: number ) {

    if ( totalBytes_ <= 0 ) {
      throw new Error( `Invalid totalBytes ${totalBytes_}` )
    }
  }

  /**
   * @return {number} The global ceiling.
   */
  public get total(): number {
    return this.totalBytes_
  }

  /**
   * @return {number} Bytes currently reserved across all models.
   */
  public get used(): number {
    return this.used_
  }

  /**
   * @return {number} Bytes still reservable without eviction.
   */
  public get available(): number {
    return this.totalBytes_ - this.used_
  }

  /**
   * Try to reserve `bytes` against the shared ceiling. Succeeds (and charges
   * the budget) only if it fits without exceeding the total; otherwise makes
   * no change and returns false, leaving the caller to evict and retry.
   *
   * @param bytes The bytes to reserve (≥ 0).
   * @return {boolean} True if reserved.
   */
  public reserve( bytes: number ): boolean {

    if ( bytes < 0 ) {
      throw new Error( `Cannot reserve negative bytes ${bytes}` )
    }

    if ( bytes > this.available ) {
      return false
    }

    this.used_ += bytes

    return true
  }

  /**
   * Release previously reserved bytes back to the shared budget.
   *
   * @param bytes The bytes to release (≥ 0). Clamped so `used` never goes
   * negative — a double-release is a no-op past zero, not a corruption.
   */
  public release( bytes: number ): void {

    if ( bytes < 0 ) {
      throw new Error( `Cannot release negative bytes ${bytes}` )
    }

    this.used_ = Math.max( 0, this.used_ - bytes )
  }

  /**
   * How many bytes a caller must evict (anywhere, across any model) before a
   * reservation of `bytes` would fit. Zero when it already fits.
   *
   * @param bytes The desired reservation.
   * @return {number} The bytes of eviction required (≥ 0).
   */
  public overageFor( bytes: number ): number {
    return Math.max( 0, bytes - this.available )
  }
}
