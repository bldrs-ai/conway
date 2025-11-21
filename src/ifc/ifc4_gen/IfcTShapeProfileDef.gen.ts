
import { IfcParameterizedProfileDef } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcNonNegativeLengthMeasure } from "./index"
import { IfcPlaneAngleMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctshapeprofiledef.htm */
export  class IfcTShapeProfileDef extends IfcParameterizedProfileDef {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTSHAPEPROFILEDEF
  }
  private Depth_? : number
  private FlangeWidth_? : number
  private WebThickness_? : number
  private FlangeThickness_? : number
  private FilletRadius_? : number | null
  private FlangeEdgeRadius_? : number | null
  private WebEdgeRadius_? : number | null
  private WebSlope_? : number | null
  private FlangeSlope_? : number | null

  public get Depth() : number {
    if ( this.Depth_ === void 0 ) {
      this.Depth_ = this.extractNumber( 3, 3, 2, false )
    }

    return this.Depth_ as number
  }

  public get FlangeWidth() : number {
    if ( this.FlangeWidth_ === void 0 ) {
      this.FlangeWidth_ = this.extractNumber( 4, 3, 2, false )
    }

    return this.FlangeWidth_ as number
  }

  public get WebThickness() : number {
    if ( this.WebThickness_ === void 0 ) {
      this.WebThickness_ = this.extractNumber( 5, 3, 2, false )
    }

    return this.WebThickness_ as number
  }

  public get FlangeThickness() : number {
    if ( this.FlangeThickness_ === void 0 ) {
      this.FlangeThickness_ = this.extractNumber( 6, 3, 2, false )
    }

    return this.FlangeThickness_ as number
  }

  public get FilletRadius() : number | null {
    if ( this.FilletRadius_ === void 0 ) {
      this.FilletRadius_ = this.extractNumber( 7, 3, 2, true )
    }

    return this.FilletRadius_ as number | null
  }

  public get FlangeEdgeRadius() : number | null {
    if ( this.FlangeEdgeRadius_ === void 0 ) {
      this.FlangeEdgeRadius_ = this.extractNumber( 8, 3, 2, true )
    }

    return this.FlangeEdgeRadius_ as number | null
  }

  public get WebEdgeRadius() : number | null {
    if ( this.WebEdgeRadius_ === void 0 ) {
      this.WebEdgeRadius_ = this.extractNumber( 9, 3, 2, true )
    }

    return this.WebEdgeRadius_ as number | null
  }

  public get WebSlope() : number | null {
    if ( this.WebSlope_ === void 0 ) {
      this.WebSlope_ = this.extractNumber( 10, 3, 2, true )
    }

    return this.WebSlope_ as number | null
  }

  public get FlangeSlope() : number | null {
    if ( this.FlangeSlope_ === void 0 ) {
      this.FlangeSlope_ = this.extractNumber( 11, 3, 2, true )
    }

    return this.FlangeSlope_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCTSHAPEPROFILEDEF ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTSHAPEPROFILEDEF
}
