
import { IfcPoint } from "./index"
import { IfcCurve } from "./index"
import { IfcParameterValue } from "./index"
import { IfcDimensionCount } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcpointoncurve.htm */
export  class IfcPointOnCurve extends IfcPoint {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPOINTONCURVE
  }
  private BasisCurve_? : IfcCurve
  private PointParameter_? : number

  public get BasisCurve() : IfcCurve {
    if ( this.BasisCurve_ === void 0 ) {
      this.BasisCurve_ = this.extractElement( 0, 0, 3, false, IfcCurve )
    }

    return this.BasisCurve_ as IfcCurve
  }

  public get PointParameter() : number {
    if ( this.PointParameter_ === void 0 ) {
      this.PointParameter_ = this.extractNumber( 1, 0, 3, false )
    }

    return this.PointParameter_ as number
  }

  public get Dim() : number {
    return this?.BasisCurve?.Dim;
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPOINTONCURVE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPOINTONCURVE
}
