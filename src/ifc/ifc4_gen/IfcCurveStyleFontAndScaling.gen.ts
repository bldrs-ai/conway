
import { IfcPresentationItem } from "./index"
import { IfcLabel } from "./index"
import { IfcCurveStyleFont } from "./index"
import { IfcPreDefinedCurveFont } from "./index"
import { IfcPositiveRatioMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccurvestylefontandscaling.htm */
export  class IfcCurveStyleFontAndScaling extends IfcPresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCURVESTYLEFONTANDSCALING
  }
  private Name_? : string | null
  private CurveFont_? : IfcCurveStyleFont | IfcPreDefinedCurveFont
  private CurveFontScaling_? : number

  public get Name() : string | null {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 0, 0, 1, true )
    }

    return this.Name_ as string | null
  }

  public get CurveFont() : IfcCurveStyleFont | IfcPreDefinedCurveFont {
    if ( this.CurveFont_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc > = 
        this.extractReference( 1, 0, 1, false )

      if ( !( value instanceof IfcCurveStyleFont ) && !( value instanceof IfcPreDefinedCurveFont ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.CurveFont_ = value as (IfcCurveStyleFont | IfcPreDefinedCurveFont)

    }

    return this.CurveFont_ as IfcCurveStyleFont | IfcPreDefinedCurveFont
  }

  public get CurveFontScaling() : number {
    if ( this.CurveFontScaling_ === void 0 ) {
      this.CurveFontScaling_ = this.extractNumber( 2, 0, 1, false )
    }

    return this.CurveFontScaling_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCURVESTYLEFONTANDSCALING ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCURVESTYLEFONTANDSCALING
}
