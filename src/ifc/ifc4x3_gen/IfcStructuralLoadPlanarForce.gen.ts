
import { IfcStructuralLoadStatic } from "./index"
import { IfcPlanarForceMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcStructuralLoadPlanarForce extends IfcStructuralLoadStatic {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSTRUCTURALLOADPLANARFORCE
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcStructuralLoadPlanarForce.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcStructuralLoadPlanarForce" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSTRUCTURALLOADPLANARFORCE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSTRUCTURALLOADPLANARFORCE
}
