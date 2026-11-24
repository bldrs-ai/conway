
import { IfcParameterizedProfileDef } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcTrapeziumProfileDef extends IfcParameterizedProfileDef {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCTRAPEZIUMPROFILEDEF
  }
  private BottomXDim_? : number
  private TopXDim_? : number
  private YDim_? : number
  private TopXOffset_? : number

  public get BottomXDim() : number {
    if ( this.BottomXDim_ === void 0 ) {
      this.BottomXDim_ = this.extractNumber( 3, 3, 2, false )
    }

    return this.BottomXDim_ as number
  }

  public get TopXDim() : number {
    if ( this.TopXDim_ === void 0 ) {
      this.TopXDim_ = this.extractNumber( 4, 3, 2, false )
    }

    return this.TopXDim_ as number
  }

  public get YDim() : number {
    if ( this.YDim_ === void 0 ) {
      this.YDim_ = this.extractNumber( 5, 3, 2, false )
    }

    return this.YDim_ as number
  }

  public get TopXOffset() : number {
    if ( this.TopXOffset_ === void 0 ) {
      this.TopXOffset_ = this.extractNumber( 6, 3, 2, false )
    }

    return this.TopXOffset_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcTrapeziumProfileDef.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcTrapeziumProfileDef" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCTRAPEZIUMPROFILEDEF ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCTRAPEZIUMPROFILEDEF
}
