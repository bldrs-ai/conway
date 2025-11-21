
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcasymmetricishapeprofiledef.htm */
export  class IfcAsymmetricIShapeProfileDef extends IfcParameterizedProfileDef {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCASYMMETRICISHAPEPROFILEDEF
  }
  private BottomFlangeWidth_? : number
  private OverallDepth_? : number
  private WebThickness_? : number
  private BottomFlangeThickness_? : number
  private BottomFlangeFilletRadius_? : number | null
  private TopFlangeWidth_? : number
  private TopFlangeThickness_? : number | null
  private TopFlangeFilletRadius_? : number | null
  private BottomFlangeEdgeRadius_? : number | null
  private BottomFlangeSlope_? : number | null
  private TopFlangeEdgeRadius_? : number | null
  private TopFlangeSlope_? : number | null

  public get BottomFlangeWidth() : number {
    if ( this.BottomFlangeWidth_ === void 0 ) {
      this.BottomFlangeWidth_ = this.extractNumber( 3, 3, 2, false )
    }

    return this.BottomFlangeWidth_ as number
  }

  public get OverallDepth() : number {
    if ( this.OverallDepth_ === void 0 ) {
      this.OverallDepth_ = this.extractNumber( 4, 3, 2, false )
    }

    return this.OverallDepth_ as number
  }

  public get WebThickness() : number {
    if ( this.WebThickness_ === void 0 ) {
      this.WebThickness_ = this.extractNumber( 5, 3, 2, false )
    }

    return this.WebThickness_ as number
  }

  public get BottomFlangeThickness() : number {
    if ( this.BottomFlangeThickness_ === void 0 ) {
      this.BottomFlangeThickness_ = this.extractNumber( 6, 3, 2, false )
    }

    return this.BottomFlangeThickness_ as number
  }

  public get BottomFlangeFilletRadius() : number | null {
    if ( this.BottomFlangeFilletRadius_ === void 0 ) {
      this.BottomFlangeFilletRadius_ = this.extractNumber( 7, 3, 2, true )
    }

    return this.BottomFlangeFilletRadius_ as number | null
  }

  public get TopFlangeWidth() : number {
    if ( this.TopFlangeWidth_ === void 0 ) {
      this.TopFlangeWidth_ = this.extractNumber( 8, 3, 2, false )
    }

    return this.TopFlangeWidth_ as number
  }

  public get TopFlangeThickness() : number | null {
    if ( this.TopFlangeThickness_ === void 0 ) {
      this.TopFlangeThickness_ = this.extractNumber( 9, 3, 2, true )
    }

    return this.TopFlangeThickness_ as number | null
  }

  public get TopFlangeFilletRadius() : number | null {
    if ( this.TopFlangeFilletRadius_ === void 0 ) {
      this.TopFlangeFilletRadius_ = this.extractNumber( 10, 3, 2, true )
    }

    return this.TopFlangeFilletRadius_ as number | null
  }

  public get BottomFlangeEdgeRadius() : number | null {
    if ( this.BottomFlangeEdgeRadius_ === void 0 ) {
      this.BottomFlangeEdgeRadius_ = this.extractNumber( 11, 3, 2, true )
    }

    return this.BottomFlangeEdgeRadius_ as number | null
  }

  public get BottomFlangeSlope() : number | null {
    if ( this.BottomFlangeSlope_ === void 0 ) {
      this.BottomFlangeSlope_ = this.extractNumber( 12, 3, 2, true )
    }

    return this.BottomFlangeSlope_ as number | null
  }

  public get TopFlangeEdgeRadius() : number | null {
    if ( this.TopFlangeEdgeRadius_ === void 0 ) {
      this.TopFlangeEdgeRadius_ = this.extractNumber( 13, 3, 2, true )
    }

    return this.TopFlangeEdgeRadius_ as number | null
  }

  public get TopFlangeSlope() : number | null {
    if ( this.TopFlangeSlope_ === void 0 ) {
      this.TopFlangeSlope_ = this.extractNumber( 14, 3, 2, true )
    }

    return this.TopFlangeSlope_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCASYMMETRICISHAPEPROFILEDEF ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCASYMMETRICISHAPEPROFILEDEF
}
