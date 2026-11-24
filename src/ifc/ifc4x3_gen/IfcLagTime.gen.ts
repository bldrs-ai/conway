
import { IfcSchedulingTime } from "./index"
import { IfcDuration } from "./index"
import { IfcRatioMeasure } from "./index"
import { IfcTaskDurationEnum, IfcTaskDurationEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcLagTime extends IfcSchedulingTime {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCLAGTIME
  }
  private LagValue_? : IfcDuration | IfcRatioMeasure
  private DurationType_? : IfcTaskDurationEnum

  public get LagValue() : IfcDuration | IfcRatioMeasure {
    if ( this.LagValue_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcLagTime.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcLagTime" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCLAGTIME ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCLAGTIME
}
