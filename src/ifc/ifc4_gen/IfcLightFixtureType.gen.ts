
import { IfcFlowTerminalType } from "./index"
import { IfcLightFixtureTypeEnum, IfcLightFixtureTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifclightfixturetype.htm */
export  class IfcLightFixtureType extends IfcFlowTerminalType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCLIGHTFIXTURETYPE
  }
  private PredefinedType_? : IfcLightFixtureTypeEnum

  public get PredefinedType() : IfcLightFixtureTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 8, IfcLightFixtureTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcLightFixtureTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCLIGHTFIXTURETYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCLIGHTFIXTURETYPE
}
