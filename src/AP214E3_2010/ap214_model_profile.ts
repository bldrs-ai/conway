import { CanonicalProfile } from '../core/canonical_profile'
import { ModelProfile } from '../core/model'


/**
 * IFC model profile cache.
 */
export class AP214ModelProfile implements ModelProfile {

  private readonly profiles_ = new Map< number, CanonicalProfile >()

  /**
   * Get the number of profiles in this.
   * @returns
   */
  get length(): number {
    return this.profiles_.size
  }

  /**
   * Add a profile to the cache.
   * @param profile
   */
  public add( profile: CanonicalProfile ) {
    this.profiles_.set( profile.localID, profile )
  }

  /**
   * Get a profile by its local id.
   * @param localID
   * @returns
   */
  public getByLocalID(localID: number): CanonicalProfile | undefined {
    return this.profiles_.get(localID)
  }

  /**
   * Iterate through the profiles in this.
   * @returns
   */
  public [Symbol.iterator](): IterableIterator<CanonicalProfile> {
    return this.profiles_.values()
  }

}
