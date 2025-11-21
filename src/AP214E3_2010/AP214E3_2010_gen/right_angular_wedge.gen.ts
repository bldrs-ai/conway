
import { geometric_representation_item } from "./index"
import { axis2_placement_3d } from "./index"
import { positive_length_measure } from "./index"
import { length_measure } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class right_angular_wedge extends geometric_representation_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.RIGHT_ANGULAR_WEDGE
  }
  private position_? : axis2_placement_3d
  private x_? : number
  private y_? : number
  private z_? : number
  private ltx_? : number

  public get position() : axis2_placement_3d {
    if ( this.position_ === void 0 ) {
      this.position_ = this.extractElement( 1, 1, 2, false, axis2_placement_3d )
    }

    return this.position_ as axis2_placement_3d
  }

  public get x() : number {
    if ( this.x_ === void 0 ) {
      this.x_ = this.extractNumber( 2, 1, 2, false )
    }

    return this.x_ as number
  }

  public get y() : number {
    if ( this.y_ === void 0 ) {
      this.y_ = this.extractNumber( 3, 1, 2, false )
    }

    return this.y_ as number
  }

  public get z() : number {
    if ( this.z_ === void 0 ) {
      this.z_ = this.extractNumber( 4, 1, 2, false )
    }

    return this.z_ as number
  }

  public get ltx() : number {
    if ( this.ltx_ === void 0 ) {
      this.ltx_ = this.extractNumber( 5, 1, 2, false )
    }

    return this.ltx_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === right_angular_wedge.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for right_angular_wedge" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.RIGHT_ANGULAR_WEDGE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.RIGHT_ANGULAR_WEDGE
}
