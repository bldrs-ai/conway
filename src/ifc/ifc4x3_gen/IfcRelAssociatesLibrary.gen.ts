
import { IfcRelAssociates } from "./index"
import { IfcLibraryInformation } from "./index"
import { IfcLibraryReference } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcRelAssociatesLibrary extends IfcRelAssociates {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRELASSOCIATESLIBRARY
  }
  private RelatingLibrary_? : IfcLibraryInformation | IfcLibraryReference

  public get RelatingLibrary() : IfcLibraryInformation | IfcLibraryReference {
    if ( this.RelatingLibrary_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRelAssociatesLibrary.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRelAssociatesLibrary" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRELASSOCIATESLIBRARY ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRELASSOCIATESLIBRARY
}
