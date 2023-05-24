
import { IfcGeometricRepresentationItem } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctessellateditem.htm */
export abstract class IfcTessellatedItem extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTESSELLATEDITEM
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCINDEXEDPOLYGONALFACE, EntityTypesIfc.IFCINDEXEDPOLYGONALFACEWITHVOIDS, EntityTypesIfc.IFCPOLYGONALFACESET, EntityTypesIfc.IFCTRIANGULATEDFACESET ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTESSELLATEDITEM
}
