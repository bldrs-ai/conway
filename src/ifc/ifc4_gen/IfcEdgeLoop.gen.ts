
import { IfcLoop } from "./index"
import { IfcOrientedEdge } from "./index"
import { IfcInteger } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
  SIZEOF,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcedgeloop.htm */
export  class IfcEdgeLoop extends IfcLoop {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCEDGELOOP
  }
  private EdgeList_? : Array<IfcOrientedEdge>

  public get EdgeList() : Array<IfcOrientedEdge> {
    if ( this.EdgeList_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 0, 0, 3 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcOrientedEdge> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcOrientedEdge )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.EdgeList_ = value
    }

    return this.EdgeList_ as Array<IfcOrientedEdge>
  }

  public get Ne() : number {
    return SIZEOF(this?.EdgeList);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCEDGELOOP ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCEDGELOOP
}
