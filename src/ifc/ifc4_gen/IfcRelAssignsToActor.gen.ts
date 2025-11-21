
import { IfcRelAssigns } from "./index"
import { IfcActor } from "./index"
import { IfcActorRole } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelassignstoactor.htm */
export  class IfcRelAssignsToActor extends IfcRelAssigns {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELASSIGNSTOACTOR
  }
  private RelatingActor_? : IfcActor
  private ActingRole_? : IfcActorRole | null

  public get RelatingActor() : IfcActor {
    if ( this.RelatingActor_ === void 0 ) {
      this.RelatingActor_ = this.extractElement( 6, 6, 3, false, IfcActor )
    }

    return this.RelatingActor_ as IfcActor
  }

  public get ActingRole() : IfcActorRole | null {
    if ( this.ActingRole_ === void 0 ) {
      this.ActingRole_ = this.extractElement( 7, 6, 3, true, IfcActorRole )
    }

    return this.ActingRole_ as IfcActorRole | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELASSIGNSTOACTOR ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELASSIGNSTOACTOR
}
