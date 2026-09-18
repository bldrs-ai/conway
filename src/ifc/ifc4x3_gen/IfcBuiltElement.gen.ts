
import { IfcElement } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcBuiltElement extends IfcElement {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCBUILTELEMENT
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcBuiltElement.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcBuiltElement" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCBUILTELEMENT, EntityTypesIfc4x3.IFCBEAM, EntityTypesIfc4x3.IFCBEARING, EntityTypesIfc4x3.IFCBUILDINGELEMENTPROXY, EntityTypesIfc4x3.IFCCHIMNEY, EntityTypesIfc4x3.IFCCOLUMN, EntityTypesIfc4x3.IFCCOURSE, EntityTypesIfc4x3.IFCCOVERING, EntityTypesIfc4x3.IFCCURTAINWALL, EntityTypesIfc4x3.IFCDEEPFOUNDATION, EntityTypesIfc4x3.IFCDOOR, EntityTypesIfc4x3.IFCEARTHWORKSELEMENT, EntityTypesIfc4x3.IFCFOOTING, EntityTypesIfc4x3.IFCKERB, EntityTypesIfc4x3.IFCMEMBER, EntityTypesIfc4x3.IFCMOORINGDEVICE, EntityTypesIfc4x3.IFCNAVIGATIONELEMENT, EntityTypesIfc4x3.IFCPAVEMENT, EntityTypesIfc4x3.IFCPLATE, EntityTypesIfc4x3.IFCRAIL, EntityTypesIfc4x3.IFCRAILING, EntityTypesIfc4x3.IFCRAMP, EntityTypesIfc4x3.IFCRAMPFLIGHT, EntityTypesIfc4x3.IFCROOF, EntityTypesIfc4x3.IFCSHADINGDEVICE, EntityTypesIfc4x3.IFCSLAB, EntityTypesIfc4x3.IFCSTAIR, EntityTypesIfc4x3.IFCSTAIRFLIGHT, EntityTypesIfc4x3.IFCTRACKELEMENT, EntityTypesIfc4x3.IFCWALL, EntityTypesIfc4x3.IFCWINDOW, EntityTypesIfc4x3.IFCCAISSONFOUNDATION, EntityTypesIfc4x3.IFCPILE, EntityTypesIfc4x3.IFCEARTHWORKSFILL, EntityTypesIfc4x3.IFCREINFORCEDSOIL, EntityTypesIfc4x3.IFCWALLSTANDARDCASE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCBUILTELEMENT
}
