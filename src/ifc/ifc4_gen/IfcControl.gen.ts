
import { IfcObject } from "./index"
import { IfcIdentifier } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccontrol.htm */
export abstract class IfcControl extends IfcObject {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCONTROL
  }
  private Identification_? : string | null

  public get Identification() : string | null {
    if ( this.Identification_ === void 0 ) {
      this.Identification_ = this.extractString( 5, 5, 3, true )
    }

    return this.Identification_ as string | null
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCACTIONREQUEST, EntityTypesIfc.IFCCOSTITEM, EntityTypesIfc.IFCCOSTSCHEDULE, EntityTypesIfc.IFCPERFORMANCEHISTORY, EntityTypesIfc.IFCPERMIT, EntityTypesIfc.IFCPROJECTORDER, EntityTypesIfc.IFCWORKCALENDAR, EntityTypesIfc.IFCWORKPLAN, EntityTypesIfc.IFCWORKSCHEDULE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCONTROL
}
