
import { IfcRelationship } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcRelConnects extends IfcRelationship {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRELCONNECTS
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRelConnects.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRelConnects" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRELCONNECTSELEMENTS, EntityTypesIfc4x3.IFCRELCONNECTSPORTTOELEMENT, EntityTypesIfc4x3.IFCRELCONNECTSPORTS, EntityTypesIfc4x3.IFCRELCONNECTSSTRUCTURALACTIVITY, EntityTypesIfc4x3.IFCRELCONNECTSSTRUCTURALMEMBER, EntityTypesIfc4x3.IFCRELCONTAINEDINSPATIALSTRUCTURE, EntityTypesIfc4x3.IFCRELCOVERSBLDGELEMENTS, EntityTypesIfc4x3.IFCRELCOVERSSPACES, EntityTypesIfc4x3.IFCRELFILLSELEMENT, EntityTypesIfc4x3.IFCRELFLOWCONTROLELEMENTS, EntityTypesIfc4x3.IFCRELINTERFERESELEMENTS, EntityTypesIfc4x3.IFCRELPOSITIONS, EntityTypesIfc4x3.IFCRELREFERENCEDINSPATIALSTRUCTURE, EntityTypesIfc4x3.IFCRELSEQUENCE, EntityTypesIfc4x3.IFCRELSERVICESBUILDINGS, EntityTypesIfc4x3.IFCRELSPACEBOUNDARY, EntityTypesIfc4x3.IFCRELCONNECTSPATHELEMENTS, EntityTypesIfc4x3.IFCRELCONNECTSWITHREALIZINGELEMENTS, EntityTypesIfc4x3.IFCRELCONNECTSWITHECCENTRICITY, EntityTypesIfc4x3.IFCRELSPACEBOUNDARY1STLEVEL, EntityTypesIfc4x3.IFCRELSPACEBOUNDARY2NDLEVEL ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRELCONNECTS
}
