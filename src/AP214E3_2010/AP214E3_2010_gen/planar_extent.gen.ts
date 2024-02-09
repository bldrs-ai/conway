
import { geometric_representation_item } from "./index"
import { length_measure } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class planar_extent extends geometric_representation_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PLANAR_EXTENT
  }
  private size_in_x_? : number
  private size_in_y_? : number

  public get size_in_x() : number {
    if ( this.size_in_x_ === void 0 ) {
      this.size_in_x_ = this.extractNumber( 1, false )
    }

    return this.size_in_x_ as number
  }

  public get size_in_y() : number {
    if ( this.size_in_y_ === void 0 ) {
      this.size_in_y_ = this.extractNumber( 2, false )
    }

    return this.size_in_y_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.PLANAR_EXTENT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PLANAR_EXTENT
}
