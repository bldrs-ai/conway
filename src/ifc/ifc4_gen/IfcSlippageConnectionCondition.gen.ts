
import { IfcStructuralConnectionCondition } from "./index"
import { IfcLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcslippageconnectioncondition.htm */
export  class IfcSlippageConnectionCondition extends IfcStructuralConnectionCondition {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSLIPPAGECONNECTIONCONDITION
  }
  private SlippageX_? : number | null
  private SlippageY_? : number | null
  private SlippageZ_? : number | null

  public get SlippageX() : number | null {
    if ( this.SlippageX_ === void 0 ) {
      this.SlippageX_ = this.extractNumber( 1, 1, 1, true )
    }

    return this.SlippageX_ as number | null
  }

  public get SlippageY() : number | null {
    if ( this.SlippageY_ === void 0 ) {
      this.SlippageY_ = this.extractNumber( 2, 1, 1, true )
    }

    return this.SlippageY_ as number | null
  }

  public get SlippageZ() : number | null {
    if ( this.SlippageZ_ === void 0 ) {
      this.SlippageZ_ = this.extractNumber( 3, 1, 1, true )
    }

    return this.SlippageZ_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSLIPPAGECONNECTIONCONDITION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSLIPPAGECONNECTIONCONDITION
}
