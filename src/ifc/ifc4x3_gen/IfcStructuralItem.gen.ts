
import { IfcProduct } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcStructuralItem extends IfcProduct {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSTRUCTURALITEM
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcStructuralItem.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcStructuralItem" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSTRUCTURALCURVECONNECTION, EntityTypesIfc4x3.IFCSTRUCTURALPOINTCONNECTION, EntityTypesIfc4x3.IFCSTRUCTURALSURFACECONNECTION, EntityTypesIfc4x3.IFCSTRUCTURALCURVEMEMBER, EntityTypesIfc4x3.IFCSTRUCTURALSURFACEMEMBER, EntityTypesIfc4x3.IFCSTRUCTURALCURVEMEMBERVARYING, EntityTypesIfc4x3.IFCSTRUCTURALSURFACEMEMBERVARYING ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSTRUCTURALITEM
}
