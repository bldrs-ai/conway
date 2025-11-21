
import { named_unit } from "./index"
import { si_prefix, si_prefixDeserializeStep } from "./index"
import { si_unit_name, si_unit_nameDeserializeStep } from "./index"
import { dimensional_exponents } from "./index"
import {
  dimensions_for_si_unit,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class si_unit extends named_unit {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.SI_UNIT
  }
  private prefix_? : si_prefix | null
  private name_? : si_unit_name

  public get prefix() : si_prefix | null {
    if ( this.prefix_ === void 0 ) {
      this.prefix_ = this.extractLambda( 1, 1, 1, si_prefixDeserializeStep, true )
    }

    return this.prefix_ as si_prefix | null
  }

  public get name() : si_unit_name {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractLambda( 2, 1, 1, si_unit_nameDeserializeStep, false )
    }

    return this.name_ as si_unit_name
  }

  public get dimensions() : dimensional_exponents {
    return dimensions_for_si_unit(this?.name);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === si_unit.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for si_unit" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.SI_UNIT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.SI_UNIT
}
