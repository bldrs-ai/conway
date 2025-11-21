
import { IfcStructuralReaction } from "./index"
import { IfcStructuralCurveActivityTypeEnum, IfcStructuralCurveActivityTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstructuralcurvereaction.htm */
export  class IfcStructuralCurveReaction extends IfcStructuralReaction {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTRUCTURALCURVEREACTION
  }
  private PredefinedType_? : IfcStructuralCurveActivityTypeEnum

  public get PredefinedType() : IfcStructuralCurveActivityTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 6, IfcStructuralCurveActivityTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcStructuralCurveActivityTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSTRUCTURALCURVEREACTION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTRUCTURALCURVEREACTION
}
