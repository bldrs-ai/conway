
import { IfcLabel } from "./index"
import { IfcText } from "./index"
import { IfcRepresentation } from "./index"
import { IfcRepresentationItem } from "./index"
import { IfcIdentifier } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcpresentationlayerassignment.htm */
export  class IfcPresentationLayerAssignment extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPRESENTATIONLAYERASSIGNMENT
  }
  private Name_? : string
  private Description_? : string | null
  private AssignedItems_? : Array<IfcRepresentation | IfcRepresentationItem>
  private Identifier_? : string | null

  public get Name() : string {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 0, 0, 0, false )
    }

    return this.Name_ as string
  }

  public get Description() : string | null {
    if ( this.Description_ === void 0 ) {
      this.Description_ = this.extractString( 1, 0, 0, true )
    }

    return this.Description_ as string | null
  }

  public get AssignedItems() : Array<IfcRepresentation | IfcRepresentationItem> {
    if ( this.AssignedItems_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 2, 0, 0 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcRepresentation | IfcRepresentationItem> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesIfc > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof IfcRepresentation ) && !( value1Untyped instanceof IfcRepresentationItem ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (IfcRepresentation | IfcRepresentationItem)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.AssignedItems_ = value
    }

    return this.AssignedItems_ as Array<IfcRepresentation | IfcRepresentationItem>
  }

  public get Identifier() : string | null {
    if ( this.Identifier_ === void 0 ) {
      this.Identifier_ = this.extractString( 3, 0, 0, true )
    }

    return this.Identifier_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPRESENTATIONLAYERASSIGNMENT, EntityTypesIfc.IFCPRESENTATIONLAYERWITHSTYLE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPRESENTATIONLAYERASSIGNMENT
}
