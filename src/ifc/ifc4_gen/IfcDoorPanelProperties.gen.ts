
import { IfcPreDefinedPropertySet } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcDoorPanelOperationEnum, IfcDoorPanelOperationEnumDeserializeStep } from "./index"
import { IfcNormalisedRatioMeasure } from "./index"
import { IfcDoorPanelPositionEnum, IfcDoorPanelPositionEnumDeserializeStep } from "./index"
import { IfcShapeAspect } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcdoorpanelproperties.htm */
export  class IfcDoorPanelProperties extends IfcPreDefinedPropertySet {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCDOORPANELPROPERTIES
  }
  private PanelDepth_? : number | null
  private PanelOperation_? : IfcDoorPanelOperationEnum
  private PanelWidth_? : number | null
  private PanelPosition_? : IfcDoorPanelPositionEnum
  private ShapeAspectStyle_? : IfcShapeAspect | null

  public get PanelDepth() : number | null {
    if ( this.PanelDepth_ === void 0 ) {
      this.PanelDepth_ = this.extractNumber( 4, 4, 4, true )
    }

    return this.PanelDepth_ as number | null
  }

  public get PanelOperation() : IfcDoorPanelOperationEnum {
    if ( this.PanelOperation_ === void 0 ) {
      this.PanelOperation_ = this.extractLambda( 5, 4, 4, IfcDoorPanelOperationEnumDeserializeStep, false )
    }

    return this.PanelOperation_ as IfcDoorPanelOperationEnum
  }

  public get PanelWidth() : number | null {
    if ( this.PanelWidth_ === void 0 ) {
      this.PanelWidth_ = this.extractNumber( 6, 4, 4, true )
    }

    return this.PanelWidth_ as number | null
  }

  public get PanelPosition() : IfcDoorPanelPositionEnum {
    if ( this.PanelPosition_ === void 0 ) {
      this.PanelPosition_ = this.extractLambda( 7, 4, 4, IfcDoorPanelPositionEnumDeserializeStep, false )
    }

    return this.PanelPosition_ as IfcDoorPanelPositionEnum
  }

  public get ShapeAspectStyle() : IfcShapeAspect | null {
    if ( this.ShapeAspectStyle_ === void 0 ) {
      this.ShapeAspectStyle_ = this.extractElement( 8, 4, 4, true, IfcShapeAspect )
    }

    return this.ShapeAspectStyle_ as IfcShapeAspect | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCDOORPANELPROPERTIES ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCDOORPANELPROPERTIES
}
