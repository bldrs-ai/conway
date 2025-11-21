
import { datum } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class datum_reference extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.DATUM_REFERENCE
  }
  private precedence_? : number
  private referenced_datum_? : datum

  public get precedence() : number {
    if ( this.precedence_ === void 0 ) {
      this.precedence_ = this.extractNumber( 0, 0, 0, false )
    }

    return this.precedence_ as number
  }

  public get referenced_datum() : datum {
    if ( this.referenced_datum_ === void 0 ) {
      this.referenced_datum_ = this.extractElement( 1, 0, 0, false, datum )
    }

    return this.referenced_datum_ as datum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === datum_reference.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for datum_reference" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.DATUM_REFERENCE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.DATUM_REFERENCE
}
