
import { IfcStructuralAction } from "./index"
import { IfcProjectedOrTrueLengthEnum, IfcProjectedOrTrueLengthEnumDeserializeStep } from "./index"
import { IfcStructuralSurfaceActivityTypeEnum, IfcStructuralSurfaceActivityTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstructuralsurfaceaction.htm */
export  class IfcStructuralSurfaceAction extends IfcStructuralAction {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTRUCTURALSURFACEACTION
  }
  private ProjectedOrTrue_? : IfcProjectedOrTrueLengthEnum | null
  private PredefinedType_? : IfcStructuralSurfaceActivityTypeEnum

  public get ProjectedOrTrue() : IfcProjectedOrTrueLengthEnum | null {
    if ( this.ProjectedOrTrue_ === void 0 ) {
      this.ProjectedOrTrue_ = this.extractLambda( 10, 10, 6, IfcProjectedOrTrueLengthEnumDeserializeStep, true )
    }

    return this.ProjectedOrTrue_ as IfcProjectedOrTrueLengthEnum | null
  }

  public get PredefinedType() : IfcStructuralSurfaceActivityTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 11, 10, 6, IfcStructuralSurfaceActivityTypeEnumDeserializeStep, false )
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
    [ EntityTypesIfc.IFCSTRUCTURALSURFACEACTION, EntityTypesIfc.IFCSTRUCTURALPLANARACTION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTRUCTURALSURFACEACTION
}
