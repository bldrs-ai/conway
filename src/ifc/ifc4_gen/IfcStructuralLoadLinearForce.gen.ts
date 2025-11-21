
import { IfcStructuralLoadStatic } from "./index"
import { IfcLinearForceMeasure } from "./index"
import { IfcLinearMomentMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstructuralloadlinearforce.htm */
export  class IfcStructuralLoadLinearForce extends IfcStructuralLoadStatic {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTRUCTURALLOADLINEARFORCE
  }
  private LinearForceX_? : number | null
  private LinearForceY_? : number | null
  private LinearForceZ_? : number | null
  private LinearMomentX_? : number | null
  private LinearMomentY_? : number | null
  private LinearMomentZ_? : number | null

  public get LinearForceX() : number | null {
    if ( this.LinearForceX_ === void 0 ) {
      this.LinearForceX_ = this.extractNumber( 1, 1, 3, true )
    }

    return this.LinearForceX_ as number | null
  }

  public get LinearForceY() : number | null {
    if ( this.LinearForceY_ === void 0 ) {
      this.LinearForceY_ = this.extractNumber( 2, 1, 3, true )
    }

    return this.LinearForceY_ as number | null
  }

  public get LinearForceZ() : number | null {
    if ( this.LinearForceZ_ === void 0 ) {
      this.LinearForceZ_ = this.extractNumber( 3, 1, 3, true )
    }

    return this.LinearForceZ_ as number | null
  }

  public get LinearMomentX() : number | null {
    if ( this.LinearMomentX_ === void 0 ) {
      this.LinearMomentX_ = this.extractNumber( 4, 1, 3, true )
    }

    return this.LinearMomentX_ as number | null
  }

  public get LinearMomentY() : number | null {
    if ( this.LinearMomentY_ === void 0 ) {
      this.LinearMomentY_ = this.extractNumber( 5, 1, 3, true )
    }

    return this.LinearMomentY_ as number | null
  }

  public get LinearMomentZ() : number | null {
    if ( this.LinearMomentZ_ === void 0 ) {
      this.LinearMomentZ_ = this.extractNumber( 6, 1, 3, true )
    }

    return this.LinearMomentZ_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSTRUCTURALLOADLINEARFORCE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTRUCTURALLOADLINEARFORCE
}
