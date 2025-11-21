
import { IfcPresentationItem } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcpredefineditem.htm */
export abstract class IfcPreDefinedItem extends IfcPresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPREDEFINEDITEM
  }
  private Name_? : string

  public get Name() : string {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 0, 0, 1, false )
    }

    return this.Name_ as string
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCDRAUGHTINGPREDEFINEDCOLOUR, EntityTypesIfc.IFCDRAUGHTINGPREDEFINEDCURVEFONT, EntityTypesIfc.IFCTEXTSTYLEFONTMODEL ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPREDEFINEDITEM
}
