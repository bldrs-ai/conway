
import { IfcPreDefinedPropertySet } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcNonNegativeLengthMeasure } from "./index"
import { IfcNormalisedRatioMeasure } from "./index"
import { IfcShapeAspect } from "./index"
import { IfcLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcWindowLiningProperties extends IfcPreDefinedPropertySet {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCWINDOWLININGPROPERTIES
  }
  private LiningDepth_? : number | null
  private LiningThickness_? : number | null
  private TransomThickness_? : number | null
  private MullionThickness_? : number | null
  private FirstTransomOffset_? : number | null
  private SecondTransomOffset_? : number | null
  private FirstMullionOffset_? : number | null
  private SecondMullionOffset_? : number | null
  private ShapeAspectStyle_? : IfcShapeAspect | null
  private LiningOffset_? : number | null
  private LiningToPanelOffsetX_? : number | null
  private LiningToPanelOffsetY_? : number | null

  public get LiningDepth() : number | null {
    if ( this.LiningDepth_ === void 0 ) {
      this.LiningDepth_ = this.extractNumber( 4, 4, 4, true )
    }

    return this.LiningDepth_ as number | null
  }

  public get LiningThickness() : number | null {
    if ( this.LiningThickness_ === void 0 ) {
      this.LiningThickness_ = this.extractNumber( 5, 4, 4, true )
    }

    return this.LiningThickness_ as number | null
  }

  public get TransomThickness() : number | null {
    if ( this.TransomThickness_ === void 0 ) {
      this.TransomThickness_ = this.extractNumber( 6, 4, 4, true )
    }

    return this.TransomThickness_ as number | null
  }

  public get MullionThickness() : number | null {
    if ( this.MullionThickness_ === void 0 ) {
      this.MullionThickness_ = this.extractNumber( 7, 4, 4, true )
    }

    return this.MullionThickness_ as number | null
  }

  public get FirstTransomOffset() : number | null {
    if ( this.FirstTransomOffset_ === void 0 ) {
      this.FirstTransomOffset_ = this.extractNumber( 8, 4, 4, true )
    }

    return this.FirstTransomOffset_ as number | null
  }

  public get SecondTransomOffset() : number | null {
    if ( this.SecondTransomOffset_ === void 0 ) {
      this.SecondTransomOffset_ = this.extractNumber( 9, 4, 4, true )
    }

    return this.SecondTransomOffset_ as number | null
  }

  public get FirstMullionOffset() : number | null {
    if ( this.FirstMullionOffset_ === void 0 ) {
      this.FirstMullionOffset_ = this.extractNumber( 10, 4, 4, true )
    }

    return this.FirstMullionOffset_ as number | null
  }

  public get SecondMullionOffset() : number | null {
    if ( this.SecondMullionOffset_ === void 0 ) {
      this.SecondMullionOffset_ = this.extractNumber( 11, 4, 4, true )
    }

    return this.SecondMullionOffset_ as number | null
  }

  public get ShapeAspectStyle() : IfcShapeAspect | null {
    if ( this.ShapeAspectStyle_ === void 0 ) {
      this.ShapeAspectStyle_ = this.extractElement( 12, 4, 4, true, IfcShapeAspect )
    }

    return this.ShapeAspectStyle_ as IfcShapeAspect | null
  }

  public get LiningOffset() : number | null {
    if ( this.LiningOffset_ === void 0 ) {
      this.LiningOffset_ = this.extractNumber( 13, 4, 4, true )
    }

    return this.LiningOffset_ as number | null
  }

  public get LiningToPanelOffsetX() : number | null {
    if ( this.LiningToPanelOffsetX_ === void 0 ) {
      this.LiningToPanelOffsetX_ = this.extractNumber( 14, 4, 4, true )
    }

    return this.LiningToPanelOffsetX_ as number | null
  }

  public get LiningToPanelOffsetY() : number | null {
    if ( this.LiningToPanelOffsetY_ === void 0 ) {
      this.LiningToPanelOffsetY_ = this.extractNumber( 15, 4, 4, true )
    }

    return this.LiningToPanelOffsetY_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcWindowLiningProperties.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcWindowLiningProperties" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCWINDOWLININGPROPERTIES ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCWINDOWLININGPROPERTIES
}
