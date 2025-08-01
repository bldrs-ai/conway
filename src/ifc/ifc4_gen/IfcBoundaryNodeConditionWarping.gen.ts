
import { IfcBoundaryNodeCondition } from "./index"
import { IfcBoolean } from "./index"
import { IfcWarpingMomentMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcboundarynodeconditionwarping.htm */
export  class IfcBoundaryNodeConditionWarping extends IfcBoundaryNodeCondition {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCBOUNDARYNODECONDITIONWARPING
  }
  private WarpingStiffness_? : IfcBoolean | IfcWarpingMomentMeasure | null

  public get WarpingStiffness() : IfcBoolean | IfcWarpingMomentMeasure | null {
    if ( this.WarpingStiffness_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCBOUNDARYNODECONDITIONWARPING ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCBOUNDARYNODECONDITIONWARPING
}
