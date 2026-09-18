
import { IfcPreDefinedPropertySet } from "./index"
import { IfcWindowPanelOperationEnum, IfcWindowPanelOperationEnumDeserializeStep } from "./index"
import { IfcWindowPanelPositionEnum, IfcWindowPanelPositionEnumDeserializeStep } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcShapeAspect } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcWindowPanelProperties extends IfcPreDefinedPropertySet {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCWINDOWPANELPROPERTIES
  }
  private OperationType_? : IfcWindowPanelOperationEnum
  private PanelPosition_? : IfcWindowPanelPositionEnum
  private FrameDepth_? : number | null
  private FrameThickness_? : number | null
  private ShapeAspectStyle_? : IfcShapeAspect | null

  public get OperationType() : IfcWindowPanelOperationEnum {
    if ( this.OperationType_ === void 0 ) {
      this.OperationType_ = this.extractLambda( 4, 4, 4, IfcWindowPanelOperationEnumDeserializeStep, false )
    }

    return this.OperationType_ as IfcWindowPanelOperationEnum
  }

  public get PanelPosition() : IfcWindowPanelPositionEnum {
    if ( this.PanelPosition_ === void 0 ) {
      this.PanelPosition_ = this.extractLambda( 5, 4, 4, IfcWindowPanelPositionEnumDeserializeStep, false )
    }

    return this.PanelPosition_ as IfcWindowPanelPositionEnum
  }

  public get FrameDepth() : number | null {
    if ( this.FrameDepth_ === void 0 ) {
      this.FrameDepth_ = this.extractNumber( 6, 4, 4, true )
    }

    return this.FrameDepth_ as number | null
  }

  public get FrameThickness() : number | null {
    if ( this.FrameThickness_ === void 0 ) {
      this.FrameThickness_ = this.extractNumber( 7, 4, 4, true )
    }

    return this.FrameThickness_ as number | null
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
        multiReference.find( ( item ) => item.typeID === IfcWindowPanelProperties.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcWindowPanelProperties" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCWINDOWPANELPROPERTIES ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCWINDOWPANELPROPERTIES
}
