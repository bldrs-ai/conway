
import { IfcStructuralMember } from "./index"
import { IfcStructuralSurfaceMemberTypeEnum, IfcStructuralSurfaceMemberTypeEnumDeserializeStep } from "./index"
import { IfcPositiveLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstructuralsurfacemember.htm */
export  class IfcStructuralSurfaceMember extends IfcStructuralMember {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTRUCTURALSURFACEMEMBER
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSTRUCTURALSURFACEMEMBER, EntityTypesIfc.IFCSTRUCTURALSURFACEMEMBERVARYING ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTRUCTURALSURFACEMEMBER
}
