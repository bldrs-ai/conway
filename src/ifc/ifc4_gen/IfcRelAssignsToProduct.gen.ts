
import { IfcRelAssigns } from "./index"
import { IfcProduct } from "./index"
import { IfcTypeProduct } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelassignstoproduct.htm */
export  class IfcRelAssignsToProduct extends IfcRelAssigns {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELASSIGNSTOPRODUCT
  }
  private RelatingProduct_? : IfcProduct | IfcTypeProduct

  public get RelatingProduct() : IfcProduct | IfcTypeProduct {
    if ( this.RelatingProduct_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc > = 
        this.extractReference( 6, 6, 3, false )

      if ( !( value instanceof IfcProduct ) && !( value instanceof IfcTypeProduct ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.RelatingProduct_ = value as (IfcProduct | IfcTypeProduct)

    }

    return this.RelatingProduct_ as IfcProduct | IfcTypeProduct
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELASSIGNSTOPRODUCT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELASSIGNSTOPRODUCT
}
