
import { geometric_representation_item } from "./index"
import { axis2_placement_3d } from "./index"
import { positive_length_measure } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class block extends geometric_representation_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.BLOCK
  }
  private position_? : axis2_placement_3d
  private x_? : number
  private y_? : number
  private z_? : number

  public get position() : axis2_placement_3d {
    if ( this.position_ === void 0 ) {
      this.position_ = this.extractElement( 1, false, axis2_placement_3d )
    }

    return this.position_ as axis2_placement_3d
  }

  public get x() : number {
    if ( this.x_ === void 0 ) {
      this.x_ = this.extractNumber( 2, false )
    }

    return this.x_ as number
  }

  public get y() : number {
    if ( this.y_ === void 0 ) {
      this.y_ = this.extractNumber( 3, false )
    }

    return this.y_ as number
  }

  public get z() : number {
    if ( this.z_ === void 0 ) {
      this.z_ = this.extractNumber( 4, false )
    }

    return this.z_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.BLOCK ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.BLOCK
}
