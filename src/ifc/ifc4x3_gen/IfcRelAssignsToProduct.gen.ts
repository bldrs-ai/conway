
import { IfcRelAssigns } from "./index"
import { IfcProduct } from "./index"
import { IfcTypeProduct } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcRelAssignsToProduct extends IfcRelAssigns {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRELASSIGNSTOPRODUCT
  }
  private RelatingProduct_? : IfcProduct | IfcTypeProduct

  public get RelatingProduct() : IfcProduct | IfcTypeProduct {
    if ( this.RelatingProduct_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRelAssignsToProduct.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRelAssignsToProduct" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRELASSIGNSTOPRODUCT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRELASSIGNSTOPRODUCT
}
