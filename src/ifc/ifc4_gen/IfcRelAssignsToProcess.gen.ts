
import { IfcRelAssigns } from "./index"
import { IfcProcess } from "./index"
import { IfcTypeProcess } from "./index"
import { IfcMeasureWithUnit } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelassignstoprocess.htm */
export  class IfcRelAssignsToProcess extends IfcRelAssigns {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELASSIGNSTOPROCESS
  }
  private RelatingProcess_? : IfcProcess | IfcTypeProcess
  private QuantityInProcess_? : IfcMeasureWithUnit | null

  public get RelatingProcess() : IfcProcess | IfcTypeProcess {
    if ( this.RelatingProcess_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc > = 
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELASSIGNSTOPROCESS ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELASSIGNSTOPROCESS
}
