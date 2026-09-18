
import { IfcElementType } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcBuiltElementType extends IfcElementType {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCBUILTELEMENTTYPE
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcBuiltElementType.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcBuiltElementType" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCBUILTELEMENTTYPE, EntityTypesIfc4x3.IFCBEAMTYPE, EntityTypesIfc4x3.IFCBEARINGTYPE, EntityTypesIfc4x3.IFCBUILDINGELEMENTPROXYTYPE, EntityTypesIfc4x3.IFCCHIMNEYTYPE, EntityTypesIfc4x3.IFCCOLUMNTYPE, EntityTypesIfc4x3.IFCCOURSETYPE, EntityTypesIfc4x3.IFCCOVERINGTYPE, EntityTypesIfc4x3.IFCCURTAINWALLTYPE, EntityTypesIfc4x3.IFCDEEPFOUNDATIONTYPE, EntityTypesIfc4x3.IFCDOORTYPE, EntityTypesIfc4x3.IFCFOOTINGTYPE, EntityTypesIfc4x3.IFCKERBTYPE, EntityTypesIfc4x3.IFCMEMBERTYPE, EntityTypesIfc4x3.IFCMOORINGDEVICETYPE, EntityTypesIfc4x3.IFCNAVIGATIONELEMENTTYPE, EntityTypesIfc4x3.IFCPAVEMENTTYPE, EntityTypesIfc4x3.IFCPLATETYPE, EntityTypesIfc4x3.IFCRAILTYPE, EntityTypesIfc4x3.IFCRAILINGTYPE, EntityTypesIfc4x3.IFCRAMPFLIGHTTYPE, EntityTypesIfc4x3.IFCRAMPTYPE, EntityTypesIfc4x3.IFCROOFTYPE, EntityTypesIfc4x3.IFCSHADINGDEVICETYPE, EntityTypesIfc4x3.IFCSLABTYPE, EntityTypesIfc4x3.IFCSTAIRFLIGHTTYPE, EntityTypesIfc4x3.IFCSTAIRTYPE, EntityTypesIfc4x3.IFCTRACKELEMENTTYPE, EntityTypesIfc4x3.IFCWALLTYPE, EntityTypesIfc4x3.IFCWINDOWTYPE, EntityTypesIfc4x3.IFCCAISSONFOUNDATIONTYPE, EntityTypesIfc4x3.IFCPILETYPE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCBUILTELEMENTTYPE
}
