
import { IfcVertex } from "./index"
import { IfcPoint } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcVertexPoint extends IfcVertex {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCVERTEXPOINT
  }
  private VertexGeometry_? : IfcPoint

  public get VertexGeometry() : IfcPoint {
    if ( this.VertexGeometry_ === void 0 ) {
      this.VertexGeometry_ = this.extractElement( 0, 0, 3, false, IfcPoint )
    }

    return this.VertexGeometry_ as IfcPoint
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcVertexPoint.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcVertexPoint" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCVERTEXPOINT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCVERTEXPOINT
}
