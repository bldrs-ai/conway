
import { IfcBuiltElementType } from "./index"
import { IfcMemberTypeEnum, IfcMemberTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcMemberType extends IfcBuiltElementType {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCMEMBERTYPE
  }
  private PredefinedType_? : IfcMemberTypeEnum

  public get PredefinedType() : IfcMemberTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 6, IfcMemberTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcMemberTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcMemberType.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcMemberType" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCMEMBERTYPE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCMEMBERTYPE
}
