
import { IfcDistributionElementType } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcDistributionControlElementType extends IfcDistributionElementType {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCDISTRIBUTIONCONTROLELEMENTTYPE
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcDistributionControlElementType.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcDistributionControlElementType" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCACTUATORTYPE, EntityTypesIfc4x3.IFCALARMTYPE, EntityTypesIfc4x3.IFCCONTROLLERTYPE, EntityTypesIfc4x3.IFCFLOWINSTRUMENTTYPE, EntityTypesIfc4x3.IFCPROTECTIVEDEVICETRIPPINGUNITTYPE, EntityTypesIfc4x3.IFCSENSORTYPE, EntityTypesIfc4x3.IFCUNITARYCONTROLELEMENTTYPE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCDISTRIBUTIONCONTROLELEMENTTYPE
}
