
import { IfcControl } from "./index"
import { IfcLabel } from "./index"
import { IfcPerformanceHistoryTypeEnum, IfcPerformanceHistoryTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcperformancehistory.htm */
export  class IfcPerformanceHistory extends IfcControl {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPERFORMANCEHISTORY
  }
  private LifeCyclePhase_? : string
  private PredefinedType_? : IfcPerformanceHistoryTypeEnum | null

  public get LifeCyclePhase() : string {
    if ( this.LifeCyclePhase_ === void 0 ) {
      this.LifeCyclePhase_ = this.extractString( 6, 6, 4, false )
    }

    return this.LifeCyclePhase_ as string
  }

  public get PredefinedType() : IfcPerformanceHistoryTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 7, 6, 4, IfcPerformanceHistoryTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcPerformanceHistoryTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPERFORMANCEHISTORY ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPERFORMANCEHISTORY
}
