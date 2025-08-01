
import { measure_with_unit } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class plane_angle_measure_with_unit extends measure_with_unit {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PLANE_ANGLE_MEASURE_WITH_UNIT
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === plane_angle_measure_with_unit.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for plane_angle_measure_with_unit" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.PLANE_ANGLE_MEASURE_WITH_UNIT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PLANE_ANGLE_MEASURE_WITH_UNIT
}
