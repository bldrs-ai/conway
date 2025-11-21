
import { IfcPhysicalSimpleQuantity } from "./index"
import { IfcMassMeasure } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcquantityweight.htm */
export  class IfcQuantityWeight extends IfcPhysicalSimpleQuantity {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCQUANTITYWEIGHT
  }
  private WeightValue_? : number
  private Formula_? : string | null

  public get WeightValue() : number {
    if ( this.WeightValue_ === void 0 ) {
      this.WeightValue_ = this.extractNumber( 3, 3, 2, false )
    }

    return this.WeightValue_ as number
  }

  public get Formula() : string | null {
    if ( this.Formula_ === void 0 ) {
      this.Formula_ = this.extractString( 4, 3, 2, true )
    }

    return this.Formula_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCQUANTITYWEIGHT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCQUANTITYWEIGHT
}
