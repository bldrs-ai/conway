
import { tolerance_zone_definition } from "./index"
import { shape_aspect } from "./index"
import { measure_with_unit } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class projected_zone_definition extends tolerance_zone_definition {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PROJECTED_ZONE_DEFINITION
  }
  private projection_end_? : shape_aspect
  private projected_length_? : measure_with_unit

  public get projection_end() : shape_aspect {
    if ( this.projection_end_ === void 0 ) {
      this.projection_end_ = this.extractElement( 2, 2, 1, false, shape_aspect )
    }

    return this.projection_end_ as shape_aspect
  }

  public get projected_length() : measure_with_unit {
    if ( this.projected_length_ === void 0 ) {
      this.projected_length_ = this.extractElement( 3, 2, 1, false, measure_with_unit )
    }

    return this.projected_length_ as measure_with_unit
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === projected_zone_definition.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for projected_zone_definition" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.PROJECTED_ZONE_DEFINITION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PROJECTED_ZONE_DEFINITION
}
