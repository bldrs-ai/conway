
import { label } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class contract_type extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CONTRACT_TYPE
  }
  private description_? : string

  public get description() : string {
    if ( this.description_ === void 0 ) {
      this.description_ = this.extractString( 0, 0, 0, false )
    }

    return this.description_ as string
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === contract_type.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for contract_type" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.CONTRACT_TYPE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CONTRACT_TYPE
}
