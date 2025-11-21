
import { IfcEdge } from "./index"
import { IfcCurve } from "./index"
import { IfcBoolean } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcedgecurve.htm */
export  class IfcEdgeCurve extends IfcEdge {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCEDGECURVE
  }
  private EdgeGeometry_? : IfcCurve
  private SameSense_? : boolean

  public get EdgeGeometry() : IfcCurve {
    if ( this.EdgeGeometry_ === void 0 ) {
      this.EdgeGeometry_ = this.extractElement( 2, 2, 3, false, IfcCurve )
    }

    return this.EdgeGeometry_ as IfcCurve
  }

  public get SameSense() : boolean {
    if ( this.SameSense_ === void 0 ) {
      this.SameSense_ = this.extractBoolean( 3, 2, 3, false )
    }

    return this.SameSense_ as boolean
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCEDGECURVE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCEDGECURVE
}
