
import { IfcRelAssignsToGroup } from "./index"
import { IfcRatioMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcRelAssignsToGroupByFactor extends IfcRelAssignsToGroup {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRELASSIGNSTOGROUPBYFACTOR
  }
  private Factor_? : number

  public get Factor() : number {
    if ( this.Factor_ === void 0 ) {
      this.Factor_ = this.extractNumber( 7, 7, 4, false )
    }

    return this.Factor_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRelAssignsToGroupByFactor.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRelAssignsToGroupByFactor" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRELASSIGNSTOGROUPBYFACTOR ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRELASSIGNSTOGROUPBYFACTOR
}
