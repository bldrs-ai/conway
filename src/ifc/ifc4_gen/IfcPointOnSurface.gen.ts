
import { IfcPoint } from "./index"
import { IfcSurface } from "./index"
import { IfcParameterValue } from "./index"
import { IfcDimensionCount } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcpointonsurface.htm */
export  class IfcPointOnSurface extends IfcPoint {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPOINTONSURFACE
  }
  private BasisSurface_? : IfcSurface
  private PointParameterU_? : number
  private PointParameterV_? : number

  public get BasisSurface() : IfcSurface {
    if ( this.BasisSurface_ === void 0 ) {
      this.BasisSurface_ = this.extractElement( 0, 0, 3, false, IfcSurface )
    }

    return this.BasisSurface_ as IfcSurface
  }

  public get PointParameterU() : number {
    if ( this.PointParameterU_ === void 0 ) {
      this.PointParameterU_ = this.extractNumber( 1, 0, 3, false )
    }

    return this.PointParameterU_ as number
  }

  public get PointParameterV() : number {
    if ( this.PointParameterV_ === void 0 ) {
      this.PointParameterV_ = this.extractNumber( 2, 0, 3, false )
    }

    return this.PointParameterV_ as number
  }

  public get Dim() : number {
    return this?.BasisSurface?.Dim;
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPOINTONSURFACE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPOINTONSURFACE
}
