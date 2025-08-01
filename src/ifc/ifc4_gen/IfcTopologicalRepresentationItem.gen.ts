
import { IfcRepresentationItem } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctopologicalrepresentationitem.htm */
export abstract class IfcTopologicalRepresentationItem extends IfcRepresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTOPOLOGICALREPRESENTATIONITEM
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCONNECTEDFACESET, EntityTypesIfc.IFCEDGE, EntityTypesIfc.IFCFACE, EntityTypesIfc.IFCFACEBOUND, EntityTypesIfc.IFCLOOP, EntityTypesIfc.IFCPATH, EntityTypesIfc.IFCVERTEX, EntityTypesIfc.IFCCLOSEDSHELL, EntityTypesIfc.IFCOPENSHELL, EntityTypesIfc.IFCEDGECURVE, EntityTypesIfc.IFCORIENTEDEDGE, EntityTypesIfc.IFCSUBEDGE, EntityTypesIfc.IFCFACESURFACE, EntityTypesIfc.IFCADVANCEDFACE, EntityTypesIfc.IFCFACEOUTERBOUND, EntityTypesIfc.IFCEDGELOOP, EntityTypesIfc.IFCPOLYLOOP, EntityTypesIfc.IFCVERTEXLOOP, EntityTypesIfc.IFCVERTEXPOINT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTOPOLOGICALREPRESENTATIONITEM
}
