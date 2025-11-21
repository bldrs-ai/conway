
import { IfcRoot } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelationship.htm */
export abstract class IfcRelationship extends IfcRoot {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELATIONSHIP
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELDECLARES, EntityTypesIfc.IFCRELASSIGNSTOACTOR, EntityTypesIfc.IFCRELASSIGNSTOCONTROL, EntityTypesIfc.IFCRELASSIGNSTOGROUP, EntityTypesIfc.IFCRELASSIGNSTOPROCESS, EntityTypesIfc.IFCRELASSIGNSTOPRODUCT, EntityTypesIfc.IFCRELASSIGNSTORESOURCE, EntityTypesIfc.IFCRELASSIGNSTOGROUPBYFACTOR, EntityTypesIfc.IFCRELASSOCIATESAPPROVAL, EntityTypesIfc.IFCRELASSOCIATESCLASSIFICATION, EntityTypesIfc.IFCRELASSOCIATESCONSTRAINT, EntityTypesIfc.IFCRELASSOCIATESDOCUMENT, EntityTypesIfc.IFCRELASSOCIATESLIBRARY, EntityTypesIfc.IFCRELASSOCIATESMATERIAL, EntityTypesIfc.IFCRELCONNECTSELEMENTS, EntityTypesIfc.IFCRELCONNECTSPORTTOELEMENT, EntityTypesIfc.IFCRELCONNECTSPORTS, EntityTypesIfc.IFCRELCONNECTSSTRUCTURALACTIVITY, EntityTypesIfc.IFCRELCONNECTSSTRUCTURALMEMBER, EntityTypesIfc.IFCRELCONTAINEDINSPATIALSTRUCTURE, EntityTypesIfc.IFCRELCOVERSBLDGELEMENTS, EntityTypesIfc.IFCRELCOVERSSPACES, EntityTypesIfc.IFCRELFILLSELEMENT, EntityTypesIfc.IFCRELFLOWCONTROLELEMENTS, EntityTypesIfc.IFCRELINTERFERESELEMENTS, EntityTypesIfc.IFCRELREFERENCEDINSPATIALSTRUCTURE, EntityTypesIfc.IFCRELSEQUENCE, EntityTypesIfc.IFCRELSERVICESBUILDINGS, EntityTypesIfc.IFCRELSPACEBOUNDARY, EntityTypesIfc.IFCRELCONNECTSPATHELEMENTS, EntityTypesIfc.IFCRELCONNECTSWITHREALIZINGELEMENTS, EntityTypesIfc.IFCRELCONNECTSWITHECCENTRICITY, EntityTypesIfc.IFCRELSPACEBOUNDARY1STLEVEL, EntityTypesIfc.IFCRELSPACEBOUNDARY2NDLEVEL, EntityTypesIfc.IFCRELAGGREGATES, EntityTypesIfc.IFCRELNESTS, EntityTypesIfc.IFCRELPROJECTSELEMENT, EntityTypesIfc.IFCRELVOIDSELEMENT, EntityTypesIfc.IFCRELDEFINESBYOBJECT, EntityTypesIfc.IFCRELDEFINESBYPROPERTIES, EntityTypesIfc.IFCRELDEFINESBYTEMPLATE, EntityTypesIfc.IFCRELDEFINESBYTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELATIONSHIP
}
