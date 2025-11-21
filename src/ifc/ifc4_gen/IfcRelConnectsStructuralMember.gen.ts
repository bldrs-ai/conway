
import { IfcRelConnects } from "./index"
import { IfcStructuralMember } from "./index"
import { IfcStructuralConnection } from "./index"
import { IfcBoundaryCondition } from "./index"
import { IfcStructuralConnectionCondition } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcAxis2Placement3D } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelconnectsstructuralmember.htm */
export  class IfcRelConnectsStructuralMember extends IfcRelConnects {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELCONNECTSSTRUCTURALMEMBER
  }
  private RelatingStructuralMember_? : IfcStructuralMember
  private RelatedStructuralConnection_? : IfcStructuralConnection
  private AppliedCondition_? : IfcBoundaryCondition | null
  private AdditionalConditions_? : IfcStructuralConnectionCondition | null
  private SupportedLength_? : number | null
  private ConditionCoordinateSystem_? : IfcAxis2Placement3D | null

  public get RelatingStructuralMember() : IfcStructuralMember {
    if ( this.RelatingStructuralMember_ === void 0 ) {
      this.RelatingStructuralMember_ = this.extractElement( 4, 4, 3, false, IfcStructuralMember )
    }

    return this.RelatingStructuralMember_ as IfcStructuralMember
  }

  public get RelatedStructuralConnection() : IfcStructuralConnection {
    if ( this.RelatedStructuralConnection_ === void 0 ) {
      this.RelatedStructuralConnection_ = this.extractElement( 5, 4, 3, false, IfcStructuralConnection )
    }

    return this.RelatedStructuralConnection_ as IfcStructuralConnection
  }

  public get AppliedCondition() : IfcBoundaryCondition | null {
    if ( this.AppliedCondition_ === void 0 ) {
      this.AppliedCondition_ = this.extractElement( 6, 4, 3, true, IfcBoundaryCondition )
    }

    return this.AppliedCondition_ as IfcBoundaryCondition | null
  }

  public get AdditionalConditions() : IfcStructuralConnectionCondition | null {
    if ( this.AdditionalConditions_ === void 0 ) {
      this.AdditionalConditions_ = this.extractElement( 7, 4, 3, true, IfcStructuralConnectionCondition )
    }

    return this.AdditionalConditions_ as IfcStructuralConnectionCondition | null
  }

  public get SupportedLength() : number | null {
    if ( this.SupportedLength_ === void 0 ) {
      this.SupportedLength_ = this.extractNumber( 8, 4, 3, true )
    }

    return this.SupportedLength_ as number | null
  }

  public get ConditionCoordinateSystem() : IfcAxis2Placement3D | null {
    if ( this.ConditionCoordinateSystem_ === void 0 ) {
      this.ConditionCoordinateSystem_ = this.extractElement( 9, 4, 3, true, IfcAxis2Placement3D )
    }

    return this.ConditionCoordinateSystem_ as IfcAxis2Placement3D | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELCONNECTSSTRUCTURALMEMBER, EntityTypesIfc.IFCRELCONNECTSWITHECCENTRICITY ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELCONNECTSSTRUCTURALMEMBER
}
