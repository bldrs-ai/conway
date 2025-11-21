
/* This is generated code, don't alter */
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'
import { edge } from "./index"
import { path } from "./index"
import { face } from "./index"
import { face_bound } from "./index"
import { closed_shell } from "./index"
import { open_shell } from "./index"

import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'


///**
// *  */
export class set_of_reversible_topology_item extends StepEntityBase< EntityTypesAP214 > {    
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.SET_OF_REVERSIBLE_TOPOLOGY_ITEM
  }

  private Value_? : Array<edge | path | face | face_bound | closed_shell | open_shell>;

  public get Value() : Array<edge | path | face | face_bound | closed_shell | open_shell> {
    if ( this.Value_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 0, 0, 0 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<edge | path | face | face_bound | closed_shell | open_shell> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesAP214 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof edge ) && !( value1Untyped instanceof path ) && !( value1Untyped instanceof face ) && !( value1Untyped instanceof face_bound ) && !( value1Untyped instanceof closed_shell ) && !( value1Untyped instanceof open_shell ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (edge | path | face | face_bound | closed_shell | open_shell)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.Value_ = value
    }

    return this.Value_ as Array<edge | path | face | face_bound | closed_shell | open_shell>
  }

  constructor(
      localID: number,
      internalReference: StepEntityInternalReference< EntityTypesAP214 >,
      model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
      multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {
     super( localID, internalReference, model )
  }

  public static readonly query =
    [ EntityTypesAP214.SET_OF_REVERSIBLE_TOPOLOGY_ITEM ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.SET_OF_REVERSIBLE_TOPOLOGY_ITEM
}
