
import { IfcSchedulingTime } from "./index"
import { IfcDuration } from "./index"
import { IfcRatioMeasure } from "./index"
import { IfcTaskDurationEnum, IfcTaskDurationEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifclagtime.htm */
export  class IfcLagTime extends IfcSchedulingTime {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCLAGTIME
  }
  private LagValue_? : IfcDuration | IfcRatioMeasure
  private DurationType_? : IfcTaskDurationEnum

  public get LagValue() : IfcDuration | IfcRatioMeasure {
    if ( this.LagValue_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc > = 
        this.extractReference( 3, 3, 1, false )

      if ( !( value instanceof IfcDuration ) && !( value instanceof IfcRatioMeasure ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.LagValue_ = value as (IfcDuration | IfcRatioMeasure)

    }

    return this.LagValue_ as IfcDuration | IfcRatioMeasure
  }

  public get DurationType() : IfcTaskDurationEnum {
    if ( this.DurationType_ === void 0 ) {
      this.DurationType_ = this.extractLambda( 4, 3, 1, IfcTaskDurationEnumDeserializeStep, false )
    }

    return this.DurationType_ as IfcTaskDurationEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCLAGTIME ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCLAGTIME
}
