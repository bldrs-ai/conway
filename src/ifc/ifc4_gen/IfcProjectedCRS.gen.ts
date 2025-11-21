
import { IfcCoordinateReferenceSystem } from "./index"
import { IfcIdentifier } from "./index"
import { IfcNamedUnit } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcprojectedcrs.htm */
export  class IfcProjectedCRS extends IfcCoordinateReferenceSystem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPROJECTEDCRS
  }
  private MapProjection_? : string | null
  private MapZone_? : string | null
  private MapUnit_? : IfcNamedUnit | null

  public get MapProjection() : string | null {
    if ( this.MapProjection_ === void 0 ) {
      this.MapProjection_ = this.extractString( 4, 4, 1, true )
    }

    return this.MapProjection_ as string | null
  }

  public get MapZone() : string | null {
    if ( this.MapZone_ === void 0 ) {
      this.MapZone_ = this.extractString( 5, 4, 1, true )
    }

    return this.MapZone_ as string | null
  }

  public get MapUnit() : IfcNamedUnit | null {
    if ( this.MapUnit_ === void 0 ) {
      this.MapUnit_ = this.extractElement( 6, 4, 1, true, IfcNamedUnit )
    }

    return this.MapUnit_ as IfcNamedUnit | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPROJECTEDCRS ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPROJECTEDCRS
}
