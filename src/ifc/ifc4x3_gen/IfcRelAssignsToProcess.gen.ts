
import { IfcRelAssigns } from "./index"
import { IfcProcess } from "./index"
import { IfcTypeProcess } from "./index"
import { IfcMeasureWithUnit } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcRelAssignsToProcess extends IfcRelAssigns {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRELASSIGNSTOPROCESS
  }
  private RelatingProcess_? : IfcProcess | IfcTypeProcess
  private QuantityInProcess_? : IfcMeasureWithUnit | null

  public get RelatingProcess() : IfcProcess | IfcTypeProcess {
    if ( this.RelatingProcess_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
        this.extractReference( 6, 6, 3, false )

      if ( !( value instanceof IfcProcess ) && !( value instanceof IfcTypeProcess ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.RelatingProcess_ = value as (IfcProcess | IfcTypeProcess)

    }

    return this.RelatingProcess_ as IfcProcess | IfcTypeProcess
  }

  public get QuantityInProcess() : IfcMeasureWithUnit | null {
    if ( this.QuantityInProcess_ === void 0 ) {
      this.QuantityInProcess_ = this.extractElement( 7, 6, 3, true, IfcMeasureWithUnit )
    }

    return this.QuantityInProcess_ as IfcMeasureWithUnit | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRelAssignsToProcess.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRelAssignsToProcess" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRELASSIGNSTOPROCESS ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRELASSIGNSTOPROCESS
}
