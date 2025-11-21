
import { label } from "./index"
import { text } from "./index"
import { measure_with_unit } from "./index"
import { shape_aspect } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class geometric_tolerance extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.GEOMETRIC_TOLERANCE
  }
  private name_? : string
  private description_? : string
  private magnitude_? : measure_with_unit
  private toleranced_shape_aspect_? : shape_aspect

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 0, 0, 0, false )
    }

    return this.name_ as string
  }

  public get description() : string {
    if ( this.description_ === void 0 ) {
      this.description_ = this.extractString( 1, 0, 0, false )
    }

    return this.description_ as string
  }

  public get magnitude() : measure_with_unit {
    if ( this.magnitude_ === void 0 ) {
      this.magnitude_ = this.extractElement( 2, 0, 0, false, measure_with_unit )
    }

    return this.magnitude_ as measure_with_unit
  }

  public get toleranced_shape_aspect() : shape_aspect {
    if ( this.toleranced_shape_aspect_ === void 0 ) {
      this.toleranced_shape_aspect_ = this.extractElement( 3, 0, 0, false, shape_aspect )
    }

    return this.toleranced_shape_aspect_ as shape_aspect
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === geometric_tolerance.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for geometric_tolerance" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.GEOMETRIC_TOLERANCE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.GEOMETRIC_TOLERANCE
}
