
import { IfcVertex } from "./index"
import { IfcPoint } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcvertexpoint.htm */
export  class IfcVertexPoint extends IfcVertex {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCVERTEXPOINT
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCVERTEXPOINT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCVERTEXPOINT
}
