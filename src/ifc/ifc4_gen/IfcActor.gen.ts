
import { IfcObject } from "./index"
import { IfcOrganization } from "./index"
import { IfcPerson } from "./index"
import { IfcPersonAndOrganization } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcactor.htm */
export  class IfcActor extends IfcObject {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCACTOR
  }
  private TheActor_? : IfcOrganization | IfcPerson | IfcPersonAndOrganization

  public get TheActor() : IfcOrganization | IfcPerson | IfcPersonAndOrganization {
    if ( this.TheActor_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc > = 
        this.extractReference( 5, 5, 3, false )

      if ( !( value instanceof IfcOrganization ) && !( value instanceof IfcPerson ) && !( value instanceof IfcPersonAndOrganization ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.TheActor_ = value as (IfcOrganization | IfcPerson | IfcPersonAndOrganization)

    }

    return this.TheActor_ as IfcOrganization | IfcPerson | IfcPersonAndOrganization
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCACTOR, EntityTypesIfc.IFCOCCUPANT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCACTOR
}
