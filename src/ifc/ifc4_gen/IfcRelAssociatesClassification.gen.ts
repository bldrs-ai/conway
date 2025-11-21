
import { IfcRelAssociates } from "./index"
import { IfcClassification } from "./index"
import { IfcClassificationReference } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelassociatesclassification.htm */
export  class IfcRelAssociatesClassification extends IfcRelAssociates {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELASSOCIATESCLASSIFICATION
  }
  private RelatingClassification_? : IfcClassification | IfcClassificationReference

  public get RelatingClassification() : IfcClassification | IfcClassificationReference {
    if ( this.RelatingClassification_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc > = 
        this.extractReference( 5, 5, 3, false )

      if ( !( value instanceof IfcClassification ) && !( value instanceof IfcClassificationReference ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.RelatingClassification_ = value as (IfcClassification | IfcClassificationReference)

    }

    return this.RelatingClassification_ as IfcClassification | IfcClassificationReference
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELASSOCIATESCLASSIFICATION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELASSOCIATESCLASSIFICATION
}
