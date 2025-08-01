
import { curve } from "./index"
import { length_measure } from "./index"
import { direction } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class offset_curve_3d extends curve {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.OFFSET_CURVE_3D
  }
  private basis_curve_? : curve
  private distance_? : number
  private self_intersect_? : boolean
  private ref_direction_? : direction

  public get basis_curve() : curve {
    if ( this.basis_curve_ === void 0 ) {
      this.basis_curve_ = this.extractElement( 1, 1, 3, false, curve )
    }

    return this.basis_curve_ as curve
  }

  public get distance() : number {
    if ( this.distance_ === void 0 ) {
      this.distance_ = this.extractNumber( 2, 1, 3, false )
    }

    return this.distance_ as number
  }

  public get self_intersect() : boolean {
    if ( this.self_intersect_ === void 0 ) {
      this.self_intersect_ = this.extractBoolean( 3, 1, 3, false )
    }

    return this.self_intersect_ as boolean
  }

  public get ref_direction() : direction {
    if ( this.ref_direction_ === void 0 ) {
      this.ref_direction_ = this.extractElement( 4, 1, 3, false, direction )
    }

    return this.ref_direction_ as direction
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === offset_curve_3d.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for offset_curve_3d" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.OFFSET_CURVE_3D ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.OFFSET_CURVE_3D
}
