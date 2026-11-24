
import { IfcFurnishingElementType } from "./index"
import { IfcSystemFurnitureElementTypeEnum, IfcSystemFurnitureElementTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcSystemFurnitureElementType extends IfcFurnishingElementType {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSYSTEMFURNITUREELEMENTTYPE
  }
  private PredefinedType_? : IfcSystemFurnitureElementTypeEnum | null

  public get PredefinedType() : IfcSystemFurnitureElementTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 6, IfcSystemFurnitureElementTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcSystemFurnitureElementTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcSystemFurnitureElementType.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcSystemFurnitureElementType" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSYSTEMFURNITUREELEMENTTYPE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSYSTEMFURNITUREELEMENTTYPE
}
