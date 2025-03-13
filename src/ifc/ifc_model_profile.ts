 
 
import { CanonicalProfile } from '../core/canonical_profile'
import {ModelProfile} from '../core/model'
import { IfcProfileDef } from './ifc4_gen'
import IfcStepModel from './ifc_step_model'


/**
 * IFC model profile cache.
 */
export class IfcModelProfile implements ModelProfile {

  private readonly profiles_ = new Map< number, CanonicalProfile >()

  /**
   * Construct this with its parent model.
   *
   * @param model The model for this.
   */
  constructor( public readonly model: IfcStepModel ) {}

  /**
   * Get the number of profiles in this.
   *
   * @return {number}
   */
  get length(): number {
    return this.profiles_.size
  }

  /**
   * Add a profile to the cache.
   *
   * @param profile
   */
  public add( profile: CanonicalProfile ) {
    this.profiles_.set( profile.localID, profile )
  }

  /**
   * Get a profile by its local id.
   *
   * @param localID
   * @return {CanonicalProfile | undefined}
   */
  public getByLocalID(localID: number): CanonicalProfile | undefined {
    return this.profiles_.get(localID)
  }

  /**
   * Iterate through the profiles in this.
   *
   * @return {IterableIterator}
   */
  public [Symbol.iterator](): IterableIterator<CanonicalProfile> {
    return this.profiles_.values()
  }


  /**
   * Get the OBJs for all the curves in the cache (lazily)
   *
   * @yields {[IfcProfileDef, string]} Curves with their matching OBJ as a string
   */
  public* objs() : IterableIterator< [IfcProfileDef, string] > {

    const model = this.model

    for ( const [localID, profile] of this.profiles_ ) {

      const profileItem = model.getElementByLocalID( localID )
      const nativeProfile = profile.nativeProfile

      if ( !( profileItem instanceof IfcProfileDef ) || nativeProfile === void 0 ) {
        continue
      }

      const objFileContents = nativeProfile.dumpToOBJ( '' )

      yield [profileItem, objFileContents]
    }
  }
}
