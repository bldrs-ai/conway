
import { IfcBoundaryNodeCondition } from "./index"
import { IfcBoolean } from "./index"
import { IfcWarpingMomentMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcBoundaryNodeConditionWarping extends IfcBoundaryNodeCondition {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCBOUNDARYNODECONDITIONWARPING
  }
  private WarpingStiffness_? : IfcBoolean | IfcWarpingMomentMeasure | null

  public get WarpingStiffness() : IfcBoolean | IfcWarpingMomentMeasure | null {
    if ( this.WarpingStiffness_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 7, 7, 2, true )

      if ( !( value instanceof IfcBoolean ) && !( value instanceof IfcWarpingMomentMeasure ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.WarpingStiffness_ = value as (IfcBoolean | IfcWarpingMomentMeasure)

    }

    return this.WarpingStiffness_ as IfcBoolean | IfcWarpingMomentMeasure | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcBoundaryNodeConditionWarping.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcBoundaryNodeConditionWarping" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCBOUNDARYNODECONDITIONWARPING ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCBOUNDARYNODECONDITIONWARPING
}
