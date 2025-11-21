
import { IfcPreDefinedPropertySet } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcNonNegativeLengthMeasure } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcShapeAspect } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcdoorliningproperties.htm */
export  class IfcDoorLiningProperties extends IfcPreDefinedPropertySet {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCDOORLININGPROPERTIES
  }
  private LiningDepth_? : number | null
  private LiningThickness_? : number | null
  private ThresholdDepth_? : number | null
  private ThresholdThickness_? : number | null
  private TransomThickness_? : number | null
  private TransomOffset_? : number | null
  private LiningOffset_? : number | null
  private ThresholdOffset_? : number | null
  private CasingThickness_? : number | null
  private CasingDepth_? : number | null
  private ShapeAspectStyle_? : IfcShapeAspect | null
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

  public get ThresholdDepth() : number | null {
    if ( this.ThresholdDepth_ === void 0 ) {
      this.ThresholdDepth_ = this.extractNumber( 6, 4, 4, true )
    }

    return this.ThresholdDepth_ as number | null
  }

  public get ThresholdThickness() : number | null {
    if ( this.ThresholdThickness_ === void 0 ) {
      this.ThresholdThickness_ = this.extractNumber( 7, 4, 4, true )
    }

    return this.ThresholdThickness_ as number | null
  }

  public get TransomThickness() : number | null {
    if ( this.TransomThickness_ === void 0 ) {
      this.TransomThickness_ = this.extractNumber( 8, 4, 4, true )
    }

    return this.TransomThickness_ as number | null
  }

  public get TransomOffset() : number | null {
    if ( this.TransomOffset_ === void 0 ) {
      this.TransomOffset_ = this.extractNumber( 9, 4, 4, true )
    }

    return this.TransomOffset_ as number | null
  }

  public get LiningOffset() : number | null {
    if ( this.LiningOffset_ === void 0 ) {
      this.LiningOffset_ = this.extractNumber( 10, 4, 4, true )
    }

    return this.LiningOffset_ as number | null
  }

  public get ThresholdOffset() : number | null {
    if ( this.ThresholdOffset_ === void 0 ) {
      this.ThresholdOffset_ = this.extractNumber( 11, 4, 4, true )
    }

    return this.ThresholdOffset_ as number | null
  }

  public get CasingThickness() : number | null {
    if ( this.CasingThickness_ === void 0 ) {
      this.CasingThickness_ = this.extractNumber( 12, 4, 4, true )
    }

    return this.CasingThickness_ as number | null
  }

  public get CasingDepth() : number | null {
    if ( this.CasingDepth_ === void 0 ) {
      this.CasingDepth_ = this.extractNumber( 13, 4, 4, true )
    }

    return this.CasingDepth_ as number | null
  }

  public get ShapeAspectStyle() : IfcShapeAspect | null {
    if ( this.ShapeAspectStyle_ === void 0 ) {
      this.ShapeAspectStyle_ = this.extractElement( 14, 4, 4, true, IfcShapeAspect )
    }

    return this.ShapeAspectStyle_ as IfcShapeAspect | null
  }

  public get LiningToPanelOffsetX() : number | null {
    if ( this.LiningToPanelOffsetX_ === void 0 ) {
      this.LiningToPanelOffsetX_ = this.extractNumber( 15, 4, 4, true )
    }

    return this.LiningToPanelOffsetX_ as number | null
  }

  public get LiningToPanelOffsetY() : number | null {
    if ( this.LiningToPanelOffsetY_ === void 0 ) {
      this.LiningToPanelOffsetY_ = this.extractNumber( 16, 4, 4, true )
    }

    return this.LiningToPanelOffsetY_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCDOORLININGPROPERTIES ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCDOORLININGPROPERTIES
}
