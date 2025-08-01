
import { IfcElement } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcbuildingelement.htm */
export abstract class IfcBuildingElement extends IfcElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCBUILDINGELEMENT
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCBEAM, EntityTypesIfc.IFCBUILDINGELEMENTPROXY, EntityTypesIfc.IFCCHIMNEY, EntityTypesIfc.IFCCOLUMN, EntityTypesIfc.IFCCOVERING, EntityTypesIfc.IFCCURTAINWALL, EntityTypesIfc.IFCDOOR, EntityTypesIfc.IFCFOOTING, EntityTypesIfc.IFCMEMBER, EntityTypesIfc.IFCPILE, EntityTypesIfc.IFCPLATE, EntityTypesIfc.IFCRAILING, EntityTypesIfc.IFCRAMP, EntityTypesIfc.IFCRAMPFLIGHT, EntityTypesIfc.IFCROOF, EntityTypesIfc.IFCSHADINGDEVICE, EntityTypesIfc.IFCSLAB, EntityTypesIfc.IFCSTAIR, EntityTypesIfc.IFCSTAIRFLIGHT, EntityTypesIfc.IFCWALL, EntityTypesIfc.IFCWINDOW, EntityTypesIfc.IFCBEAMSTANDARDCASE, EntityTypesIfc.IFCCOLUMNSTANDARDCASE, EntityTypesIfc.IFCDOORSTANDARDCASE, EntityTypesIfc.IFCMEMBERSTANDARDCASE, EntityTypesIfc.IFCPLATESTANDARDCASE, EntityTypesIfc.IFCSLABELEMENTEDCASE, EntityTypesIfc.IFCSLABSTANDARDCASE, EntityTypesIfc.IFCWALLELEMENTEDCASE, EntityTypesIfc.IFCWALLSTANDARDCASE, EntityTypesIfc.IFCWINDOWSTANDARDCASE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCBUILDINGELEMENT
}
