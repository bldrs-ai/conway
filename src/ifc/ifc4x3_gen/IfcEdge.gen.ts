
import { IfcTopologicalRepresentationItem } from "./index"
import { IfcVertex } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcEdge extends IfcTopologicalRepresentationItem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCEDGE
  }
  private EdgeStart_? : IfcVertex
  private EdgeEnd_? : IfcVertex

  public get EdgeStart() : IfcVertex {
    if ( this.EdgeStart_ === void 0 ) {
      this.EdgeStart_ = this.extractElement( 0, 0, 2, false, IfcVertex )
    }

    return this.EdgeStart_ as IfcVertex
  }

  public get EdgeEnd() : IfcVertex {
    if ( this.EdgeEnd_ === void 0 ) {
      this.EdgeEnd_ = this.extractElement( 1, 0, 2, false, IfcVertex )
    }

    return this.EdgeEnd_ as IfcVertex
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcEdge.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcEdge" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCEDGE, EntityTypesIfc4x3.IFCEDGECURVE, EntityTypesIfc4x3.IFCORIENTEDEDGE, EntityTypesIfc4x3.IFCSUBEDGE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCEDGE
}
