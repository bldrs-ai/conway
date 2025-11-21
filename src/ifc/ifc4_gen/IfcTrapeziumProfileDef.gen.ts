
import { IfcParameterizedProfileDef } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctrapeziumprofiledef.htm */
export  class IfcTrapeziumProfileDef extends IfcParameterizedProfileDef {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTRAPEZIUMPROFILEDEF
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCTRAPEZIUMPROFILEDEF ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTRAPEZIUMPROFILEDEF
}
