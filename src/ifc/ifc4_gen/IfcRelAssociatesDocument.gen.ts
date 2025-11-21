
import { IfcRelAssociates } from "./index"
import { IfcDocumentInformation } from "./index"
import { IfcDocumentReference } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelassociatesdocument.htm */
export  class IfcRelAssociatesDocument extends IfcRelAssociates {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELASSOCIATESDOCUMENT
  }
  private RelatingDocument_? : IfcDocumentInformation | IfcDocumentReference

  public get RelatingDocument() : IfcDocumentInformation | IfcDocumentReference {
    if ( this.RelatingDocument_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc > = 
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELASSOCIATESDOCUMENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELASSOCIATESDOCUMENT
}
