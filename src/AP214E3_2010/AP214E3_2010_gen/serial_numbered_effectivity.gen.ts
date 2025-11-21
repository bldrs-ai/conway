
import { effectivity } from "./index"
import { identifier } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class serial_numbered_effectivity extends effectivity {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.SERIAL_NUMBERED_EFFECTIVITY
  }
  private effectivity_start_id_? : string
  private effectivity_end_id_? : string | null

  public get effectivity_start_id() : string {
    if ( this.effectivity_start_id_ === void 0 ) {
      this.effectivity_start_id_ = this.extractString( 1, 1, 1, false )
    }

    return this.effectivity_start_id_ as string
  }

  public get effectivity_end_id() : string | null {
    if ( this.effectivity_end_id_ === void 0 ) {
      this.effectivity_end_id_ = this.extractString( 2, 1, 1, true )
    }

    return this.effectivity_end_id_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === serial_numbered_effectivity.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for serial_numbered_effectivity" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.SERIAL_NUMBERED_EFFECTIVITY ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.SERIAL_NUMBERED_EFFECTIVITY
}
