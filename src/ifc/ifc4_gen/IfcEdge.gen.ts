
import { IfcTopologicalRepresentationItem } from "./index"
import { IfcVertex } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcedge.htm */
export  class IfcEdge extends IfcTopologicalRepresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCEDGE
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCEDGE, EntityTypesIfc.IFCEDGECURVE, EntityTypesIfc.IFCORIENTEDEDGE, EntityTypesIfc.IFCSUBEDGE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCEDGE
}
