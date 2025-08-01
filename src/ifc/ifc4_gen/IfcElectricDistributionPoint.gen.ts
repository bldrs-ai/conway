
import { IfcFlowController } from "./index"
import { IfcElectricDistributionPointFunctionEnum, IfcElectricDistributionPointFunctionEnumDeserializeStep } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcelectricdistributionpoint.htm */
export  class IfcElectricDistributionPoint extends IfcFlowController {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCELECTRICDISTRIBUTIONPOINT
  }
  private DistributionPointFunction_? : IfcElectricDistributionPointFunctionEnum
  private UserDefinedFunction_? : string | null

  public get DistributionPointFunction() : IfcElectricDistributionPointFunctionEnum {
    if ( this.DistributionPointFunction_ === void 0 ) {
      this.DistributionPointFunction_ = this.extractLambda( 8, 8, 8, IfcElectricDistributionPointFunctionEnumDeserializeStep, false )
    }

    return this.DistributionPointFunction_ as IfcElectricDistributionPointFunctionEnum
  }

  public get UserDefinedFunction() : string | null {
    if ( this.UserDefinedFunction_ === void 0 ) {
      this.UserDefinedFunction_ = this.extractString( 9, 8, 8, true )
    }

    return this.UserDefinedFunction_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCELECTRICDISTRIBUTIONPOINT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCELECTRICDISTRIBUTIONPOINT
}
