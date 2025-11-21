
import { IfcElementComponent } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcreinforcingelement.htm */
export abstract class IfcReinforcingElement extends IfcElementComponent {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCREINFORCINGELEMENT
  }
  private SteelGrade_? : string | null

  public get SteelGrade() : string | null {
    if ( this.SteelGrade_ === void 0 ) {
      this.SteelGrade_ = this.extractString( 8, 8, 6, true )
    }

    return this.SteelGrade_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCREINFORCINGBAR, EntityTypesIfc.IFCREINFORCINGMESH, EntityTypesIfc.IFCTENDON, EntityTypesIfc.IFCTENDONANCHOR ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCREINFORCINGELEMENT
}
