/**
 * Constants related to index sets.
 */
export default class IndexSetConstants {

  public static readonly MASK_BOTTOMBITS = 31
  public static readonly MASK_TOPBITS    = ( ~IndexSetConstants.MASK_BOTTOMBITS ) >>> 0
  public static readonly SHIFT_TOPBITS   = 5
}
