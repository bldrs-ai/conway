
import { IfcPresentationLayerAssignment } from "./index"
import { IfcLogical } from "./index"
import { IfcPresentationStyle } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcpresentationlayerwithstyle.htm */
export  class IfcPresentationLayerWithStyle extends IfcPresentationLayerAssignment {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPRESENTATIONLAYERWITHSTYLE
  }
  private LayerOn_? : boolean | null
  private LayerFrozen_? : boolean | null
  private LayerBlocked_? : boolean | null
  private LayerStyles_? : Array<IfcPresentationStyle>

  public get LayerOn() : boolean | null {
    if ( this.LayerOn_ === void 0 ) {
      this.LayerOn_ = this.extractLogical( 4, 4, 1, false )
    }

    return this.LayerOn_ as boolean | null
  }

  public get LayerFrozen() : boolean | null {
    if ( this.LayerFrozen_ === void 0 ) {
      this.LayerFrozen_ = this.extractLogical( 5, 4, 1, false )
    }

    return this.LayerFrozen_ as boolean | null
  }

  public get LayerBlocked() : boolean | null {
    if ( this.LayerBlocked_ === void 0 ) {
      this.LayerBlocked_ = this.extractLogical( 6, 4, 1, false )
    }

    return this.LayerBlocked_ as boolean | null
  }

  public get LayerStyles() : Array<IfcPresentationStyle> {
    if ( this.LayerStyles_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 7, 4, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcPresentationStyle> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcPresentationStyle )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.LayerStyles_ = value
    }

    return this.LayerStyles_ as Array<IfcPresentationStyle>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPRESENTATIONLAYERWITHSTYLE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPRESENTATIONLAYERWITHSTYLE
}
