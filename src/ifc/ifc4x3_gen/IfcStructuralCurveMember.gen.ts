
import { IfcStructuralMember } from "./index"
import { IfcStructuralCurveMemberTypeEnum, IfcStructuralCurveMemberTypeEnumDeserializeStep } from "./index"
import { IfcDirection } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcStructuralCurveMember extends IfcStructuralMember {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSTRUCTURALCURVEMEMBER
  }
  private PredefinedType_? : IfcStructuralCurveMemberTypeEnum
  private Axis_? : IfcDirection

  public get PredefinedType() : IfcStructuralCurveMemberTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 7, 7, 6, IfcStructuralCurveMemberTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcStructuralCurveMemberTypeEnum
  }

  public get Axis() : IfcDirection {
    if ( this.Axis_ === void 0 ) {
      this.Axis_ = this.extractElement( 8, 7, 6, false, IfcDirection )
    }

    return this.Axis_ as IfcDirection
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcStructuralCurveMember.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcStructuralCurveMember" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSTRUCTURALCURVEMEMBER, EntityTypesIfc4x3.IFCSTRUCTURALCURVEMEMBERVARYING ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSTRUCTURALCURVEMEMBER
}
