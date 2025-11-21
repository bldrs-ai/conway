
import { IfcParameterizedProfileDef } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcNonNegativeLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccshapeprofiledef.htm */
export  class IfcCShapeProfileDef extends IfcParameterizedProfileDef {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCSHAPEPROFILEDEF
  }
  private Depth_? : number
  private Width_? : number
  private WallThickness_? : number
  private Girth_? : number
  private InternalFilletRadius_? : number | null

  public get Depth() : number {
    if ( this.Depth_ === void 0 ) {
      this.Depth_ = this.extractNumber( 3, 3, 2, false )
    }

    return this.Depth_ as number
  }

  public get Width() : number {
    if ( this.Width_ === void 0 ) {
      this.Width_ = this.extractNumber( 4, 3, 2, false )
    }

    return this.Width_ as number
  }

  public get WallThickness() : number {
    if ( this.WallThickness_ === void 0 ) {
      this.WallThickness_ = this.extractNumber( 5, 3, 2, false )
    }

    return this.WallThickness_ as number
  }

  public get Girth() : number {
    if ( this.Girth_ === void 0 ) {
      this.Girth_ = this.extractNumber( 6, 3, 2, false )
    }

    return this.Girth_ as number
  }

  public get InternalFilletRadius() : number | null {
    if ( this.InternalFilletRadius_ === void 0 ) {
      this.InternalFilletRadius_ = this.extractNumber( 7, 3, 2, true )
    }

    return this.InternalFilletRadius_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCSHAPEPROFILEDEF ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCSHAPEPROFILEDEF
}
