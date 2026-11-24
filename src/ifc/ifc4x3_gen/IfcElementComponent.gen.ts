
import { IfcElement } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcElementComponent extends IfcElement {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCELEMENTCOMPONENT
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcElementComponent.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcElementComponent" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCBUILDINGELEMENTPART, EntityTypesIfc4x3.IFCDISCRETEACCESSORY, EntityTypesIfc4x3.IFCFASTENER, EntityTypesIfc4x3.IFCIMPACTPROTECTIONDEVICE, EntityTypesIfc4x3.IFCMECHANICALFASTENER, EntityTypesIfc4x3.IFCSIGN, EntityTypesIfc4x3.IFCVIBRATIONDAMPER, EntityTypesIfc4x3.IFCVIBRATIONISOLATOR, EntityTypesIfc4x3.IFCREINFORCINGBAR, EntityTypesIfc4x3.IFCREINFORCINGMESH, EntityTypesIfc4x3.IFCTENDON, EntityTypesIfc4x3.IFCTENDONANCHOR, EntityTypesIfc4x3.IFCTENDONCONDUIT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCELEMENTCOMPONENT
}
