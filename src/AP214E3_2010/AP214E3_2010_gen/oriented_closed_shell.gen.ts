
import { closed_shell } from "./index"
import { face } from "./index"
import {
  conditional_reverse,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class oriented_closed_shell extends closed_shell {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ORIENTED_CLOSED_SHELL
  }
  private closed_shell_element_? : closed_shell
  private orientation_? : boolean

  public get closed_shell_element() : closed_shell {
    if ( this.closed_shell_element_ === void 0 ) {
      this.closed_shell_element_ = this.extractElement( 2, 2, 4, false, closed_shell )
    }

    return this.closed_shell_element_ as closed_shell
  }

  public get orientation() : boolean {
    if ( this.orientation_ === void 0 ) {
      this.orientation_ = this.extractBoolean( 3, 2, 4, false )
    }

    return this.orientation_ as boolean
  }

  public get cfs_faces() : Array<face> {
    return conditional_reverse(this?.orientation,this?.closed_shell_element.cfs_faces);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === oriented_closed_shell.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for oriented_closed_shell" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.ORIENTED_CLOSED_SHELL ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ORIENTED_CLOSED_SHELL
}
