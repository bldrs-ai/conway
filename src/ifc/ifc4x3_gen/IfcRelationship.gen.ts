
import { IfcRoot } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcRelationship extends IfcRoot {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRELATIONSHIP
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRelationship.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRelationship" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRELDECLARES, EntityTypesIfc4x3.IFCRELASSIGNSTOACTOR, EntityTypesIfc4x3.IFCRELASSIGNSTOCONTROL, EntityTypesIfc4x3.IFCRELASSIGNSTOGROUP, EntityTypesIfc4x3.IFCRELASSIGNSTOPROCESS, EntityTypesIfc4x3.IFCRELASSIGNSTOPRODUCT, EntityTypesIfc4x3.IFCRELASSIGNSTORESOURCE, EntityTypesIfc4x3.IFCRELASSIGNSTOGROUPBYFACTOR, EntityTypesIfc4x3.IFCRELASSOCIATESAPPROVAL, EntityTypesIfc4x3.IFCRELASSOCIATESCLASSIFICATION, EntityTypesIfc4x3.IFCRELASSOCIATESCONSTRAINT, EntityTypesIfc4x3.IFCRELASSOCIATESDOCUMENT, EntityTypesIfc4x3.IFCRELASSOCIATESLIBRARY, EntityTypesIfc4x3.IFCRELASSOCIATESMATERIAL, EntityTypesIfc4x3.IFCRELASSOCIATESPROFILEDEF, EntityTypesIfc4x3.IFCRELCONNECTSELEMENTS, EntityTypesIfc4x3.IFCRELCONNECTSPORTTOELEMENT, EntityTypesIfc4x3.IFCRELCONNECTSPORTS, EntityTypesIfc4x3.IFCRELCONNECTSSTRUCTURALACTIVITY, EntityTypesIfc4x3.IFCRELCONNECTSSTRUCTURALMEMBER, EntityTypesIfc4x3.IFCRELCONTAINEDINSPATIALSTRUCTURE, EntityTypesIfc4x3.IFCRELCOVERSBLDGELEMENTS, EntityTypesIfc4x3.IFCRELCOVERSSPACES, EntityTypesIfc4x3.IFCRELFILLSELEMENT, EntityTypesIfc4x3.IFCRELFLOWCONTROLELEMENTS, EntityTypesIfc4x3.IFCRELINTERFERESELEMENTS, EntityTypesIfc4x3.IFCRELPOSITIONS, EntityTypesIfc4x3.IFCRELREFERENCEDINSPATIALSTRUCTURE, EntityTypesIfc4x3.IFCRELSEQUENCE, EntityTypesIfc4x3.IFCRELSERVICESBUILDINGS, EntityTypesIfc4x3.IFCRELSPACEBOUNDARY, EntityTypesIfc4x3.IFCRELCONNECTSPATHELEMENTS, EntityTypesIfc4x3.IFCRELCONNECTSWITHREALIZINGELEMENTS, EntityTypesIfc4x3.IFCRELCONNECTSWITHECCENTRICITY, EntityTypesIfc4x3.IFCRELSPACEBOUNDARY1STLEVEL, EntityTypesIfc4x3.IFCRELSPACEBOUNDARY2NDLEVEL, EntityTypesIfc4x3.IFCRELADHERESTOELEMENT, EntityTypesIfc4x3.IFCRELAGGREGATES, EntityTypesIfc4x3.IFCRELNESTS, EntityTypesIfc4x3.IFCRELPROJECTSELEMENT, EntityTypesIfc4x3.IFCRELVOIDSELEMENT, EntityTypesIfc4x3.IFCRELDEFINESBYOBJECT, EntityTypesIfc4x3.IFCRELDEFINESBYPROPERTIES, EntityTypesIfc4x3.IFCRELDEFINESBYTEMPLATE, EntityTypesIfc4x3.IFCRELDEFINESBYTYPE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRELATIONSHIP
}
