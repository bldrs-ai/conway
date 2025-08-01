
import { geometric_representation_item } from "./index"
import { surface } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class half_space_solid extends geometric_representation_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.HALF_SPACE_SOLID
  }
  private base_surface_? : surface
  private agreement_flag_? : boolean

  public get base_surface() : surface {
    if ( this.base_surface_ === void 0 ) {
      this.base_surface_ = this.extractElement( 1, 1, 2, false, surface )
    }

    return this.base_surface_ as surface
  }

  public get agreement_flag() : boolean {
    if ( this.agreement_flag_ === void 0 ) {
      this.agreement_flag_ = this.extractBoolean( 2, 1, 2, false )
    }

    return this.agreement_flag_ as boolean
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === half_space_solid.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for half_space_solid" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.HALF_SPACE_SOLID ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.HALF_SPACE_SOLID
}
