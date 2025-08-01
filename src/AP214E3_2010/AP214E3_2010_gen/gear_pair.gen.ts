
import { kinematic_pair } from "./index"
import { length_measure } from "./index"
import { plane_angle_measure } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class gear_pair extends kinematic_pair {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.GEAR_PAIR
  }
  private radius_first_link_? : number
  private radius_second_link_? : number
  private bevel_? : number
  private helical_angle_? : number
  private gear_ratio_? : number

  public get radius_first_link() : number {
    if ( this.radius_first_link_ === void 0 ) {
      this.radius_first_link_ = this.extractNumber( 5, 5, 2, false )
    }

    return this.radius_first_link_ as number
  }

  public get radius_second_link() : number {
    if ( this.radius_second_link_ === void 0 ) {
      this.radius_second_link_ = this.extractNumber( 6, 5, 2, false )
    }

    return this.radius_second_link_ as number
  }

  public get bevel() : number {
    if ( this.bevel_ === void 0 ) {
      this.bevel_ = this.extractNumber( 7, 5, 2, false )
    }

    return this.bevel_ as number
  }

  public get helical_angle() : number {
    if ( this.helical_angle_ === void 0 ) {
      this.helical_angle_ = this.extractNumber( 8, 5, 2, false )
    }

    return this.helical_angle_ as number
  }

  public get gear_ratio() : number {
    if ( this.gear_ratio_ === void 0 ) {
      this.gear_ratio_ = this.extractNumber( 9, 5, 2, false )
    }

    return this.gear_ratio_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === gear_pair.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for gear_pair" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.GEAR_PAIR ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.GEAR_PAIR
}
