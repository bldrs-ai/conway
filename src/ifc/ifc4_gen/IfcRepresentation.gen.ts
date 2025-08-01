
import { IfcRepresentationContext } from "./index"
import { IfcLabel } from "./index"
import { IfcRepresentationItem } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrepresentation.htm */
export abstract class IfcRepresentation extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCREPRESENTATION
  }
  private ContextOfItems_? : IfcRepresentationContext
  private RepresentationIdentifier_? : string | null
  private RepresentationType_? : string | null
  private Items_? : Array<IfcRepresentationItem>

  public get ContextOfItems() : IfcRepresentationContext {
    if ( this.ContextOfItems_ === void 0 ) {
      this.ContextOfItems_ = this.extractElement( 0, 0, 0, false, IfcRepresentationContext )
    }

    return this.ContextOfItems_ as IfcRepresentationContext
  }

  public get RepresentationIdentifier() : string | null {
    if ( this.RepresentationIdentifier_ === void 0 ) {
      this.RepresentationIdentifier_ = this.extractString( 1, 0, 0, true )
    }

    return this.RepresentationIdentifier_ as string | null
  }

  public get RepresentationType() : string | null {
    if ( this.RepresentationType_ === void 0 ) {
      this.RepresentationType_ = this.extractString( 2, 0, 0, true )
    }

    return this.RepresentationType_ as string | null
  }

  public get Items() : Array<IfcRepresentationItem> {
    if ( this.Items_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 3, 0, 0 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcRepresentationItem> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcRepresentationItem )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.Items_ = value
    }

    return this.Items_ as Array<IfcRepresentationItem>
  }



  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSHAPEREPRESENTATION, EntityTypesIfc.IFCTOPOLOGYREPRESENTATION, EntityTypesIfc.IFCSTYLEDREPRESENTATION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCREPRESENTATION
}
