
import { IfcPreDefinedPropertySet } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcDoorPanelOperationEnum, IfcDoorPanelOperationEnumDeserializeStep } from "./index"
import { IfcNormalisedRatioMeasure } from "./index"
import { IfcDoorPanelPositionEnum, IfcDoorPanelPositionEnumDeserializeStep } from "./index"
import { IfcShapeAspect } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcDoorPanelProperties extends IfcPreDefinedPropertySet {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCDOORPANELPROPERTIES
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcDoorPanelProperties.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcDoorPanelProperties" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCDOORPANELPROPERTIES ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCDOORPANELPROPERTIES
}
