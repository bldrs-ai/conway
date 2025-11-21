
import { IfcRelConnectsElements } from "./index"
import { IfcElement } from "./index"
import { IfcLabel } from "./index"
import {
  stepExtractOptional,
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelconnectswithrealizingelements.htm */
export  class IfcRelConnectsWithRealizingElements extends IfcRelConnectsElements {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELCONNECTSWITHREALIZINGELEMENTS
  }
  private RealizingElements_? : Array<IfcElement>
  private ConnectionType_? : string | null

  public get RealizingElements() : Array<IfcElement> {
    if ( this.RealizingElements_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 7, 7, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcElement> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcElement )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.RealizingElements_ = value
    }

    return this.RealizingElements_ as Array<IfcElement>
  }

  public get ConnectionType() : string | null {
    if ( this.ConnectionType_ === void 0 ) {
      this.ConnectionType_ = this.extractString( 8, 7, 4, true )
    }

    return this.ConnectionType_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELCONNECTSWITHREALIZINGELEMENTS ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELCONNECTSWITHREALIZINGELEMENTS
}
