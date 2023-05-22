
import { IfcParameterizedProfileDef } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcNonNegativeLengthMeasure } from "./index"
import { IfcPlaneAngleMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../core/step_entity_internal_reference'
import StepEntityBase from '../../core/step_entity_base'
import StepModelBase from '../../core/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifclshapeprofiledef.htm */
export  class IfcLShapeProfileDef extends IfcParameterizedProfileDef {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCLSHAPEPROFILEDEF
  }
  private Depth_? : number
  private Width_? : number | null
  private Thickness_? : number
  private FilletRadius_? : number | null
  private EdgeRadius_? : number | null
  private LegSlope_? : number | null

  public get Depth() : number {
    if ( this.Depth_ === void 0 ) {
      this.Depth_ = this.extractNumber( 3, false )
    }

    return this.Depth_ as number
  }

  public get Width() : number | null {
    if ( this.Width_ === void 0 ) {
      this.Width_ = this.extractNumber( 4, true )
    }

    return this.Width_ as number | null
  }

  public get Thickness() : number {
    if ( this.Thickness_ === void 0 ) {
      this.Thickness_ = this.extractNumber( 5, false )
    }

    return this.Thickness_ as number
  }

  public get FilletRadius() : number | null {
    if ( this.FilletRadius_ === void 0 ) {
      this.FilletRadius_ = this.extractNumber( 6, true )
    }

    return this.FilletRadius_ as number | null
  }

  public get EdgeRadius() : number | null {
    if ( this.EdgeRadius_ === void 0 ) {
      this.EdgeRadius_ = this.extractNumber( 7, true )
    }

    return this.EdgeRadius_ as number | null
  }

  public get LegSlope() : number | null {
    if ( this.LegSlope_ === void 0 ) {
      this.LegSlope_ = this.extractNumber( 8, true )
    }

    return this.LegSlope_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCLSHAPEPROFILEDEF ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCLSHAPEPROFILEDEF
}
