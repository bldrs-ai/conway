
import { IfcStructuralLoadStatic } from "./index"
import { IfcForceMeasure } from "./index"
import { IfcTorqueMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstructuralloadsingleforce.htm */
export  class IfcStructuralLoadSingleForce extends IfcStructuralLoadStatic {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTRUCTURALLOADSINGLEFORCE
  }
  private ForceX_? : number | null
  private ForceY_? : number | null
  private ForceZ_? : number | null
  private MomentX_? : number | null
  private MomentY_? : number | null
  private MomentZ_? : number | null

  public get ForceX() : number | null {
    if ( this.ForceX_ === void 0 ) {
      this.ForceX_ = this.extractNumber( 1, 1, 3, true )
    }

    return this.ForceX_ as number | null
  }

  public get ForceY() : number | null {
    if ( this.ForceY_ === void 0 ) {
      this.ForceY_ = this.extractNumber( 2, 1, 3, true )
    }

    return this.ForceY_ as number | null
  }

  public get ForceZ() : number | null {
    if ( this.ForceZ_ === void 0 ) {
      this.ForceZ_ = this.extractNumber( 3, 1, 3, true )
    }

    return this.ForceZ_ as number | null
  }

  public get MomentX() : number | null {
    if ( this.MomentX_ === void 0 ) {
      this.MomentX_ = this.extractNumber( 4, 1, 3, true )
    }

    return this.MomentX_ as number | null
  }

  public get MomentY() : number | null {
    if ( this.MomentY_ === void 0 ) {
      this.MomentY_ = this.extractNumber( 5, 1, 3, true )
    }

    return this.MomentY_ as number | null
  }

  public get MomentZ() : number | null {
    if ( this.MomentZ_ === void 0 ) {
      this.MomentZ_ = this.extractNumber( 6, 1, 3, true )
    }

    return this.MomentZ_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSTRUCTURALLOADSINGLEFORCE, EntityTypesIfc.IFCSTRUCTURALLOADSINGLEFORCEWARPING ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTRUCTURALLOADSINGLEFORCE
}
