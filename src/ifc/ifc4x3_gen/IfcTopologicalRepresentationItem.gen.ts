
import { IfcRepresentationItem } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcTopologicalRepresentationItem extends IfcRepresentationItem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCTOPOLOGICALREPRESENTATIONITEM
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcTopologicalRepresentationItem.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcTopologicalRepresentationItem" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCONNECTEDFACESET, EntityTypesIfc4x3.IFCEDGE, EntityTypesIfc4x3.IFCFACE, EntityTypesIfc4x3.IFCFACEBOUND, EntityTypesIfc4x3.IFCLOOP, EntityTypesIfc4x3.IFCPATH, EntityTypesIfc4x3.IFCVERTEX, EntityTypesIfc4x3.IFCCLOSEDSHELL, EntityTypesIfc4x3.IFCOPENSHELL, EntityTypesIfc4x3.IFCEDGECURVE, EntityTypesIfc4x3.IFCORIENTEDEDGE, EntityTypesIfc4x3.IFCSUBEDGE, EntityTypesIfc4x3.IFCFACESURFACE, EntityTypesIfc4x3.IFCADVANCEDFACE, EntityTypesIfc4x3.IFCFACEOUTERBOUND, EntityTypesIfc4x3.IFCEDGELOOP, EntityTypesIfc4x3.IFCPOLYLOOP, EntityTypesIfc4x3.IFCVERTEXLOOP, EntityTypesIfc4x3.IFCVERTEXPOINT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCTOPOLOGICALREPRESENTATIONITEM
}
