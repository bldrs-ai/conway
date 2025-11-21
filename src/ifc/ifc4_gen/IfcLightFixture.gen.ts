
import { IfcFlowTerminal } from "./index"
import { IfcLightFixtureTypeEnum, IfcLightFixtureTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifclightfixture.htm */
export  class IfcLightFixture extends IfcFlowTerminal {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCLIGHTFIXTURE
  }
  private PredefinedType_? : IfcLightFixtureTypeEnum | null

  public get PredefinedType() : IfcLightFixtureTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcLightFixtureTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcLightFixtureTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCLIGHTFIXTURE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCLIGHTFIXTURE
}
