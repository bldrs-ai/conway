
import { IfcRelAssociates } from "./index"
import { IfcLibraryInformation } from "./index"
import { IfcLibraryReference } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelassociateslibrary.htm */
export  class IfcRelAssociatesLibrary extends IfcRelAssociates {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELASSOCIATESLIBRARY
  }
  private RelatingLibrary_? : IfcLibraryInformation | IfcLibraryReference

  public get RelatingLibrary() : IfcLibraryInformation | IfcLibraryReference {
    if ( this.RelatingLibrary_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc > = 
        this.extractReference( 5, 5, 3, false )

      if ( !( value instanceof IfcLibraryInformation ) && !( value instanceof IfcLibraryReference ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.RelatingLibrary_ = value as (IfcLibraryInformation | IfcLibraryReference)

    }

    return this.RelatingLibrary_ as IfcLibraryInformation | IfcLibraryReference
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELASSOCIATESLIBRARY ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELASSOCIATESLIBRARY
}
