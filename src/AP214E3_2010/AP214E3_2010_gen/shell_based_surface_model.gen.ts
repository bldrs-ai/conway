
import { geometric_representation_item } from "./index"
import { open_shell } from "./index"
import { closed_shell } from "./index"
import {
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/shell_based_surface_model.htm */
export  class shell_based_surface_model extends geometric_representation_item {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.SHELL_BASED_SURFACE_MODEL
  }
  private sbsm_boundary_? : Array<open_shell | closed_shell>

  public get sbsm_boundary() : Array<open_shell | closed_shell> {
    if ( this.sbsm_boundary_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      const value : Array<open_shell | closed_shell> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesIfc > | undefined =
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof open_shell ) && !( value1Untyped instanceof closed_shell ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (open_shell | closed_shell)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.sbsm_boundary_ = value
    }

    return this.sbsm_boundary_ as Array<open_shell | closed_shell>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.SHELL_BASED_SURFACE_MODEL ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.SHELL_BASED_SURFACE_MODEL
}
