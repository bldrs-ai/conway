
import { IfcRelationship } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelconnects.htm */
export abstract class IfcRelConnects extends IfcRelationship {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELCONNECTS
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELCONNECTSELEMENTS, EntityTypesIfc.IFCRELCONNECTSPORTTOELEMENT, EntityTypesIfc.IFCRELCONNECTSPORTS, EntityTypesIfc.IFCRELCONNECTSSTRUCTURALACTIVITY, EntityTypesIfc.IFCRELCONNECTSSTRUCTURALMEMBER, EntityTypesIfc.IFCRELCONTAINEDINSPATIALSTRUCTURE, EntityTypesIfc.IFCRELCOVERSBLDGELEMENTS, EntityTypesIfc.IFCRELCOVERSSPACES, EntityTypesIfc.IFCRELFILLSELEMENT, EntityTypesIfc.IFCRELFLOWCONTROLELEMENTS, EntityTypesIfc.IFCRELINTERFERESELEMENTS, EntityTypesIfc.IFCRELREFERENCEDINSPATIALSTRUCTURE, EntityTypesIfc.IFCRELSEQUENCE, EntityTypesIfc.IFCRELSERVICESBUILDINGS, EntityTypesIfc.IFCRELSPACEBOUNDARY, EntityTypesIfc.IFCRELCONNECTSPATHELEMENTS, EntityTypesIfc.IFCRELCONNECTSWITHREALIZINGELEMENTS, EntityTypesIfc.IFCRELCONNECTSWITHECCENTRICITY, EntityTypesIfc.IFCRELSPACEBOUNDARY1STLEVEL, EntityTypesIfc.IFCRELSPACEBOUNDARY2NDLEVEL ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELCONNECTS
}
