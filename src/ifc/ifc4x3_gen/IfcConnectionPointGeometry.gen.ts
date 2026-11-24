
import { IfcConnectionGeometry } from "./index"
import { IfcPoint } from "./index"
import { IfcVertexPoint } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcConnectionPointGeometry extends IfcConnectionGeometry {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCCONNECTIONPOINTGEOMETRY
  }
  private PointOnRelatingElement_? : IfcPoint | IfcVertexPoint
  private PointOnRelatedElement_? : IfcPoint | IfcVertexPoint | null

  public get PointOnRelatingElement() : IfcPoint | IfcVertexPoint {
    if ( this.PointOnRelatingElement_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
        this.extractReference( 0, 0, 1, false )

      if ( !( value instanceof IfcPoint ) && !( value instanceof IfcVertexPoint ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.PointOnRelatingElement_ = value as (IfcPoint | IfcVertexPoint)

    }

    return this.PointOnRelatingElement_ as IfcPoint | IfcVertexPoint
  }

  public get PointOnRelatedElement() : IfcPoint | IfcVertexPoint | null {
    if ( this.PointOnRelatedElement_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 1, 0, 1, true )

      if ( !( value instanceof IfcPoint ) && !( value instanceof IfcVertexPoint ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.PointOnRelatedElement_ = value as (IfcPoint | IfcVertexPoint)

    }

    return this.PointOnRelatedElement_ as IfcPoint | IfcVertexPoint | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcConnectionPointGeometry.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcConnectionPointGeometry" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCONNECTIONPOINTGEOMETRY, EntityTypesIfc4x3.IFCCONNECTIONPOINTECCENTRICITY ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCCONNECTIONPOINTGEOMETRY
}
