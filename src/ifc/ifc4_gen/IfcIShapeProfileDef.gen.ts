
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcishapeprofiledef.htm */
export  class IfcIShapeProfileDef extends IfcParameterizedProfileDef {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCISHAPEPROFILEDEF
  }
  private OverallWidth_? : number
  private OverallDepth_? : number
  private WebThickness_? : number
  private FlangeThickness_? : number
  private FilletRadius_? : number | null
  private FlangeEdgeRadius_? : number | null
  private FlangeSlope_? : number | null

  public get OverallWidth() : number {
    if ( this.OverallWidth_ === void 0 ) {
      this.OverallWidth_ = this.extractNumber( 3, 3, 2, false )
    }

    return this.OverallWidth_ as number
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

  public get FlangeSlope() : number | null {
    if ( this.FlangeSlope_ === void 0 ) {
      this.FlangeSlope_ = this.extractNumber( 9, 3, 2, true )
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
    [ EntityTypesIfc.IFCISHAPEPROFILEDEF ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCISHAPEPROFILEDEF
}
