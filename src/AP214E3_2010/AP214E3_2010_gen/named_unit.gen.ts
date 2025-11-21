
import { dimensional_exponents } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class named_unit extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.NAMED_UNIT
  }
  private dimensions_? : dimensional_exponents

  public get dimensions() : dimensional_exponents {
    if ( this.dimensions_ === void 0 ) {
      this.dimensions_ = this.extractElement( 0, 0, 0, false, dimensional_exponents )
    }

    return this.dimensions_ as dimensional_exponents
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === named_unit.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for named_unit" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.NAMED_UNIT, EntityTypesAP214.SI_UNIT, EntityTypesAP214.CONVERSION_BASED_UNIT, EntityTypesAP214.CONTEXT_DEPENDENT_UNIT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.NAMED_UNIT
}
