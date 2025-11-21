
import { IfcExtrudedAreaSolid } from "./index"
import { IfcProfileDef } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcextrudedareasolidtapered.htm */
export  class IfcExtrudedAreaSolidTapered extends IfcExtrudedAreaSolid {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCEXTRUDEDAREASOLIDTAPERED
  }
  private EndSweptArea_? : IfcProfileDef

  public get EndSweptArea() : IfcProfileDef {
    if ( this.EndSweptArea_ === void 0 ) {
      this.EndSweptArea_ = this.extractElement( 4, 4, 5, false, IfcProfileDef )
    }

    return this.EndSweptArea_ as IfcProfileDef
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCEXTRUDEDAREASOLIDTAPERED ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCEXTRUDEDAREASOLIDTAPERED
}
