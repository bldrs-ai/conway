
import { IfcBuiltElement } from "./index"
import { IfcInteger } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcStairFlightTypeEnum, IfcStairFlightTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcStairFlight extends IfcBuiltElement {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSTAIRFLIGHT
  }
  private NumberOfRisers_? : number | null
  private NumberOfTreads_? : number | null
  private RiserHeight_? : number | null
  private TreadLength_? : number | null
  private PredefinedType_? : IfcStairFlightTypeEnum | null

  public get NumberOfRisers() : number | null {
    if ( this.NumberOfRisers_ === void 0 ) {
      this.NumberOfRisers_ = this.extractNumber( 8, 8, 6, true )
    }

    return this.NumberOfRisers_ as number | null
  }

  public get NumberOfTreads() : number | null {
    if ( this.NumberOfTreads_ === void 0 ) {
      this.NumberOfTreads_ = this.extractNumber( 9, 8, 6, true )
    }

    return this.NumberOfTreads_ as number | null
  }

  public get RiserHeight() : number | null {
    if ( this.RiserHeight_ === void 0 ) {
      this.RiserHeight_ = this.extractNumber( 10, 8, 6, true )
    }

    return this.RiserHeight_ as number | null
  }

  public get TreadLength() : number | null {
    if ( this.TreadLength_ === void 0 ) {
      this.TreadLength_ = this.extractNumber( 11, 8, 6, true )
    }

    return this.TreadLength_ as number | null
  }

  public get PredefinedType() : IfcStairFlightTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 12, 8, 6, IfcStairFlightTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcStairFlightTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcStairFlight.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcStairFlight" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSTAIRFLIGHT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSTAIRFLIGHT
}
