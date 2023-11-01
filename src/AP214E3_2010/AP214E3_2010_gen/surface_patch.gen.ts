
import { founded_item } from "./index"
import { bounded_surface } from "./index"
import { transition_code, transition_codeDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/surface_patch.htm */
export  class surface_patch extends founded_item {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.SURFACE_PATCH
  }
  private parent_surface_? : bounded_surface
  private u_transition_? : transition_code
  private v_transition_? : transition_code
  private u_sense_? : boolean
  private v_sense_? : boolean

  public get parent_surface() : bounded_surface {
    if ( this.parent_surface_ === void 0 ) {
      this.parent_surface_ = this.extractElement( 0, false, bounded_surface )
    }

    return this.parent_surface_ as bounded_surface
  }

  public get u_transition() : transition_code {
    if ( this.u_transition_ === void 0 ) {
      this.u_transition_ = this.extractLambda( 1, transition_codeDeserializeStep, false )
    }

    return this.u_transition_ as transition_code
  }

  public get v_transition() : transition_code {
    if ( this.v_transition_ === void 0 ) {
      this.v_transition_ = this.extractLambda( 2, transition_codeDeserializeStep, false )
    }

    return this.v_transition_ as transition_code
  }

  public get u_sense() : boolean {
    if ( this.u_sense_ === void 0 ) {
      this.u_sense_ = this.extractBoolean( 3, false )
    }

    return this.u_sense_ as boolean
  }

  public get v_sense() : boolean {
    if ( this.v_sense_ === void 0 ) {
      this.v_sense_ = this.extractBoolean( 4, false )
    }

    return this.v_sense_ as boolean
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.SURFACE_PATCH ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.SURFACE_PATCH
}
