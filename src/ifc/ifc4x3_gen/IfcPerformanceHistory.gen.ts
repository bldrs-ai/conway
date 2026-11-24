
import { IfcControl } from "./index"
import { IfcLabel } from "./index"
import { IfcPerformanceHistoryTypeEnum, IfcPerformanceHistoryTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcPerformanceHistory extends IfcControl {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCPERFORMANCEHISTORY
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcPerformanceHistory.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcPerformanceHistory" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCPERFORMANCEHISTORY ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCPERFORMANCEHISTORY
}
