
import { IfcConnectionGeometry } from "./index"
import { IfcPoint } from "./index"
import { IfcVertexPoint } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcconnectionpointgeometry.htm */
export  class IfcConnectionPointGeometry extends IfcConnectionGeometry {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCONNECTIONPOINTGEOMETRY
  }
  private PointOnRelatingElement_? : IfcPoint | IfcVertexPoint
  private PointOnRelatedElement_? : IfcPoint | IfcVertexPoint | null

  public get PointOnRelatingElement() : IfcPoint | IfcVertexPoint {
    if ( this.PointOnRelatingElement_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc > = 
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
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCONNECTIONPOINTGEOMETRY, EntityTypesIfc.IFCCONNECTIONPOINTECCENTRICITY ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCONNECTIONPOINTGEOMETRY
}
