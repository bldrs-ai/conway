
import { measure_with_unit } from "./index"
import { label } from "./index"
import { text } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class uncertainty_measure_with_unit extends measure_with_unit {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.UNCERTAINTY_MEASURE_WITH_UNIT
  }
  private name_? : string
  private description_? : string | null

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 2, false )
    }

    return this.name_ as string
  }

  public get description() : string | null {
    if ( this.description_ === void 0 ) {
      this.description_ = this.extractString( 3, true )
    }

    return this.description_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.UNCERTAINTY_MEASURE_WITH_UNIT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.UNCERTAINTY_MEASURE_WITH_UNIT
}
