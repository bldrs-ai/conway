
import { IfcParameterizedProfileDef } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcNonNegativeLengthMeasure } from "./index"
import { IfcPlaneAngleMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcLShapeProfileDef extends IfcParameterizedProfileDef {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCLSHAPEPROFILEDEF
  }
  private Depth_? : number
  private Width_? : number | null
  private Thickness_? : number
  private FilletRadius_? : number | null
  private EdgeRadius_? : number | null
  private LegSlope_? : number | null

  public get Depth() : number {
    if ( this.Depth_ === void 0 ) {
      this.Depth_ = this.extractNumber( 3, 3, 2, false )
    }

    return this.Depth_ as number
  }

  public get Width() : number | null {
    if ( this.Width_ === void 0 ) {
      this.Width_ = this.extractNumber( 4, 3, 2, true )
    }

    return this.Width_ as number | null
  }

  public get Thickness() : number {
    if ( this.Thickness_ === void 0 ) {
      this.Thickness_ = this.extractNumber( 5, 3, 2, false )
    }

    return this.Thickness_ as number
  }

  public get FilletRadius() : number | null {
    if ( this.FilletRadius_ === void 0 ) {
      this.FilletRadius_ = this.extractNumber( 6, 3, 2, true )
    }

    return this.FilletRadius_ as number | null
  }

  public get EdgeRadius() : number | null {
    if ( this.EdgeRadius_ === void 0 ) {
      this.EdgeRadius_ = this.extractNumber( 7, 3, 2, true )
    }

    return this.EdgeRadius_ as number | null
  }

  public get LegSlope() : number | null {
    if ( this.LegSlope_ === void 0 ) {
      this.LegSlope_ = this.extractNumber( 8, 3, 2, true )
    }

    return this.LegSlope_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcLShapeProfileDef.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcLShapeProfileDef" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCLSHAPEPROFILEDEF ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCLSHAPEPROFILEDEF
}
