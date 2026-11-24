
import { IfcResourceLevelRelationship } from "./index"
import { IfcMonetaryUnit } from "./index"
import { IfcPositiveRatioMeasure } from "./index"
import { IfcDateTime } from "./index"
import { IfcLibraryInformation } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcCurrencyRelationship extends IfcResourceLevelRelationship {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCCURRENCYRELATIONSHIP
  }
  private RelatingMonetaryUnit_? : IfcMonetaryUnit
  private RelatedMonetaryUnit_? : IfcMonetaryUnit
  private ExchangeRate_? : number
  private RateDateTime_? : string | null
  private RateSource_? : IfcLibraryInformation | null

  public get RelatingMonetaryUnit() : IfcMonetaryUnit {
    if ( this.RelatingMonetaryUnit_ === void 0 ) {
      this.RelatingMonetaryUnit_ = this.extractElement( 2, 2, 1, false, IfcMonetaryUnit )
    }

    return this.RelatingMonetaryUnit_ as IfcMonetaryUnit
  }

  public get RelatedMonetaryUnit() : IfcMonetaryUnit {
    if ( this.RelatedMonetaryUnit_ === void 0 ) {
      this.RelatedMonetaryUnit_ = this.extractElement( 3, 2, 1, false, IfcMonetaryUnit )
    }

    return this.RelatedMonetaryUnit_ as IfcMonetaryUnit
  }

  public get ExchangeRate() : number {
    if ( this.ExchangeRate_ === void 0 ) {
      this.ExchangeRate_ = this.extractNumber( 4, 2, 1, false )
    }

    return this.ExchangeRate_ as number
  }

  public get RateDateTime() : string | null {
    if ( this.RateDateTime_ === void 0 ) {
      this.RateDateTime_ = this.extractString( 5, 2, 1, true )
    }

    return this.RateDateTime_ as string | null
  }

  public get RateSource() : IfcLibraryInformation | null {
    if ( this.RateSource_ === void 0 ) {
      this.RateSource_ = this.extractElement( 6, 2, 1, true, IfcLibraryInformation )
    }

    return this.RateSource_ as IfcLibraryInformation | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcCurrencyRelationship.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcCurrencyRelationship" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCURRENCYRELATIONSHIP ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCCURRENCYRELATIONSHIP
}
