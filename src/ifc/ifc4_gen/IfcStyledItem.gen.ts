
import { IfcRepresentationItem } from "./index"
import { IfcPresentationStyle } from "./index"
import { IfcPresentationStyleAssignment } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstyleditem.htm */
export  class IfcStyledItem extends IfcRepresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTYLEDITEM
  }
  private Item_? : IfcRepresentationItem | null
  private Styles_? : Array<IfcPresentationStyle | IfcPresentationStyleAssignment>
  private Name_? : string | null

  public get Item() : IfcRepresentationItem | null {
    if ( this.Item_ === void 0 ) {
      this.Item_ = this.extractElement( 0, 0, 1, true, IfcRepresentationItem )
    }

    return this.Item_ as IfcRepresentationItem | null
  }

  public get Styles() : Array<IfcPresentationStyle | IfcPresentationStyleAssignment> {
    if ( this.Styles_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 0, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcPresentationStyle | IfcPresentationStyleAssignment> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesIfc > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof IfcPresentationStyle ) && !( value1Untyped instanceof IfcPresentationStyleAssignment ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (IfcPresentationStyle | IfcPresentationStyleAssignment)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.Styles_ = value
    }

    return this.Styles_ as Array<IfcPresentationStyle | IfcPresentationStyleAssignment>
  }

  public get Name() : string | null {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 2, 0, 1, true )
    }

    return this.Name_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSTYLEDITEM ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTYLEDITEM
}
