
import { IfcExternalSpatialStructureElement } from "./index"
import { IfcExternalSpatialElementTypeEnum, IfcExternalSpatialElementTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcExternalSpatialElement extends IfcExternalSpatialStructureElement {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCEXTERNALSPATIALELEMENT
  }
  private PredefinedType_? : IfcExternalSpatialElementTypeEnum | null

  public get PredefinedType() : IfcExternalSpatialElementTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 6, IfcExternalSpatialElementTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcExternalSpatialElementTypeEnum | null
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcExternalSpatialElement.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcExternalSpatialElement" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCEXTERNALSPATIALELEMENT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCEXTERNALSPATIALELEMENT
}
