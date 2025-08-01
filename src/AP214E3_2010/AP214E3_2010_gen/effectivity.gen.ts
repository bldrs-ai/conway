
import { identifier } from "./index"
import { label } from "./index"
import { text } from "./index"
import {
  get_name_value,
  get_description_value,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class effectivity extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.EFFECTIVITY
  }
  private id_? : string

  public get id() : string {
    if ( this.id_ === void 0 ) {
      this.id_ = this.extractString( 0, 0, 0, false )
    }

    return this.id_ as string
  }

  public get name() : string {
    return get_name_value(this);
  }

  public get description() : string {
    return get_description_value(this);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === effectivity.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for effectivity" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.EFFECTIVITY, EntityTypesAP214.SERIAL_NUMBERED_EFFECTIVITY, EntityTypesAP214.DATED_EFFECTIVITY, EntityTypesAP214.LOT_EFFECTIVITY, EntityTypesAP214.TIME_INTERVAL_BASED_EFFECTIVITY ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.EFFECTIVITY
}
