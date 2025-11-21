
import { IfcStructuralLoadStatic } from "./index"
import { IfcPlanarForceMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstructuralloadplanarforce.htm */
export  class IfcStructuralLoadPlanarForce extends IfcStructuralLoadStatic {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTRUCTURALLOADPLANARFORCE
  }
  private PlanarForceX_? : number | null
  private PlanarForceY_? : number | null
  private PlanarForceZ_? : number | null

  public get PlanarForceX() : number | null {
    if ( this.PlanarForceX_ === void 0 ) {
      this.PlanarForceX_ = this.extractNumber( 1, 1, 3, true )
    }

    return this.PlanarForceX_ as number | null
  }

  public get PlanarForceY() : number | null {
    if ( this.PlanarForceY_ === void 0 ) {
      this.PlanarForceY_ = this.extractNumber( 2, 1, 3, true )
    }

    return this.PlanarForceY_ as number | null
  }

  public get PlanarForceZ() : number | null {
    if ( this.PlanarForceZ_ === void 0 ) {
      this.PlanarForceZ_ = this.extractNumber( 3, 1, 3, true )
    }

    return this.PlanarForceZ_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSTRUCTURALLOADPLANARFORCE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTRUCTURALLOADPLANARFORCE
}
