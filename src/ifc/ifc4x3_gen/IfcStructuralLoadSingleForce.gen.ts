
import { IfcStructuralLoadStatic } from "./index"
import { IfcForceMeasure } from "./index"
import { IfcTorqueMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcStructuralLoadSingleForce extends IfcStructuralLoadStatic {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSTRUCTURALLOADSINGLEFORCE
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcStructuralLoadSingleForce.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcStructuralLoadSingleForce" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSTRUCTURALLOADSINGLEFORCE, EntityTypesIfc4x3.IFCSTRUCTURALLOADSINGLEFORCEWARPING ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSTRUCTURALLOADSINGLEFORCE
}
