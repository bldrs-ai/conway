
import { IfcPresentationItem } from "./index"
import { IfcLabel } from "./index"
import { IfcCurveStyleFont } from "./index"
import { IfcPreDefinedCurveFont } from "./index"
import { IfcPositiveRatioMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcCurveStyleFontAndScaling extends IfcPresentationItem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCCURVESTYLEFONTANDSCALING
  }
  private Name_? : string | null
  private CurveStyleFont_? : IfcCurveStyleFont | IfcPreDefinedCurveFont
  private CurveFontScaling_? : number

  public get Name() : string | null {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 0, 0, 1, true )
    }

    return this.Name_ as string | null
  }

  public get CurveStyleFont() : IfcCurveStyleFont | IfcPreDefinedCurveFont {
    if ( this.CurveStyleFont_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
        this.extractReference( 1, 0, 1, false )

      if ( !( value instanceof IfcCurveStyleFont ) && !( value instanceof IfcPreDefinedCurveFont ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.CurveStyleFont_ = value as (IfcCurveStyleFont | IfcPreDefinedCurveFont)

    }

    return this.CurveStyleFont_ as IfcCurveStyleFont | IfcPreDefinedCurveFont
  }

  public get CurveFontScaling() : number {
    if ( this.CurveFontScaling_ === void 0 ) {
      this.CurveFontScaling_ = this.extractNumber( 2, 0, 1, false )
    }

    return this.CurveFontScaling_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcCurveStyleFontAndScaling.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcCurveStyleFontAndScaling" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCURVESTYLEFONTANDSCALING ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCCURVESTYLEFONTANDSCALING
}
