

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class precision_qualifier extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PRECISION_QUALIFIER
  }
  private precision_value_? : number

  public get precision_value() : number {
    if ( this.precision_value_ === void 0 ) {
      this.precision_value_ = this.extractNumber( 0, 0, 0, false )
    }

    return this.precision_value_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === precision_qualifier.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for precision_qualifier" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.PRECISION_QUALIFIER ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PRECISION_QUALIFIER
}
