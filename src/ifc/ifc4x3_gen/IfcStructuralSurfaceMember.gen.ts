
import { IfcStructuralMember } from "./index"
import { IfcStructuralSurfaceMemberTypeEnum, IfcStructuralSurfaceMemberTypeEnumDeserializeStep } from "./index"
import { IfcPositiveLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcStructuralSurfaceMember extends IfcStructuralMember {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSTRUCTURALSURFACEMEMBER
  }
  private PredefinedType_? : IfcStructuralSurfaceMemberTypeEnum
  private Thickness_? : number | null

  public get PredefinedType() : IfcStructuralSurfaceMemberTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 7, 7, 6, IfcStructuralSurfaceMemberTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcStructuralSurfaceMemberTypeEnum
  }

  public get Thickness() : number | null {
    if ( this.Thickness_ === void 0 ) {
      this.Thickness_ = this.extractNumber( 8, 7, 6, true )
    }

    return this.Thickness_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcStructuralSurfaceMember.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcStructuralSurfaceMember" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSTRUCTURALSURFACEMEMBER, EntityTypesIfc4x3.IFCSTRUCTURALSURFACEMEMBERVARYING ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSTRUCTURALSURFACEMEMBER
}
