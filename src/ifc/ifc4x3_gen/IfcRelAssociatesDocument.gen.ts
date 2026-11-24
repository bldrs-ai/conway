
import { IfcRelAssociates } from "./index"
import { IfcDocumentInformation } from "./index"
import { IfcDocumentReference } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcRelAssociatesDocument extends IfcRelAssociates {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRELASSOCIATESDOCUMENT
  }
  private RelatingDocument_? : IfcDocumentInformation | IfcDocumentReference

  public get RelatingDocument() : IfcDocumentInformation | IfcDocumentReference {
    if ( this.RelatingDocument_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
        this.extractReference( 5, 5, 3, false )

      if ( !( value instanceof IfcDocumentInformation ) && !( value instanceof IfcDocumentReference ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.RelatingDocument_ = value as (IfcDocumentInformation | IfcDocumentReference)

    }

    return this.RelatingDocument_ as IfcDocumentInformation | IfcDocumentReference
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRelAssociatesDocument.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRelAssociatesDocument" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRELASSOCIATESDOCUMENT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRELASSOCIATESDOCUMENT
}
