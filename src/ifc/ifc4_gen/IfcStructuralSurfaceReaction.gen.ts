
import { IfcStructuralReaction } from "./index"
import { IfcStructuralSurfaceActivityTypeEnum, IfcStructuralSurfaceActivityTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstructuralsurfacereaction.htm */
export  class IfcStructuralSurfaceReaction extends IfcStructuralReaction {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTRUCTURALSURFACEREACTION
  }
  private PredefinedType_? : IfcStructuralSurfaceActivityTypeEnum

  public get PredefinedType() : IfcStructuralSurfaceActivityTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 6, IfcStructuralSurfaceActivityTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcStructuralSurfaceActivityTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSTRUCTURALSURFACEREACTION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTRUCTURALSURFACEREACTION
}
