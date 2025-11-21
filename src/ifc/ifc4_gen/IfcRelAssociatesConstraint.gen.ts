
import { IfcRelAssociates } from "./index"
import { IfcLabel } from "./index"
import { IfcConstraint } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelassociatesconstraint.htm */
export  class IfcRelAssociatesConstraint extends IfcRelAssociates {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELASSOCIATESCONSTRAINT
  }
  private Intent_? : string | null
  private RelatingConstraint_? : IfcConstraint

  public get Intent() : string | null {
    if ( this.Intent_ === void 0 ) {
      this.Intent_ = this.extractString( 5, 5, 3, true )
    }

    return this.Intent_ as string | null
  }

  public get RelatingConstraint() : IfcConstraint {
    if ( this.RelatingConstraint_ === void 0 ) {
      this.RelatingConstraint_ = this.extractElement( 6, 5, 3, false, IfcConstraint )
    }

    return this.RelatingConstraint_ as IfcConstraint
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELASSOCIATESCONSTRAINT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELASSOCIATESCONSTRAINT
}
