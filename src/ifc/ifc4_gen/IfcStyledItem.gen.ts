
import { IfcRepresentationItem } from "./index"
import { IfcPresentationStyle } from "./index"
import { IfcPresentationStyleAssignment } from "./index"
import { IfcLabel } from "./index"
import {
  stepExtractArray,
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
      this.Item_ = this.extractElement( 0, true, IfcRepresentationItem )
    }

    return this.Item_ as IfcRepresentationItem | null
  }

  public get Styles() : Array<IfcPresentationStyle | IfcPresentationStyleAssignment> {
    if ( this.Styles_ === void 0 ) {
      this.Styles_ = this.extractLambda( 1, (buffer, cursor, endCursor) => {

      let value : Array<IfcPresentationStyle | IfcPresentationStyleAssignment> = [];

      for ( let address of stepExtractArray( buffer, cursor, endCursor ) ) {
        value.push( (() => {
          const cursor = address
          const value : StepEntityBase< EntityTypesIfc > | undefined =
            this.extractBufferReference( buffer, cursor, endCursor )
    
          if ( !( value instanceof IfcPresentationStyle ) && !( value instanceof IfcPresentationStyleAssignment ) ) {
            throw new Error( 'Value in select must be populated' )
          }
          return value as (IfcPresentationStyle | IfcPresentationStyleAssignment)})() )
      }
      return value }, false )
    }

    return this.Styles_ as Array<IfcPresentationStyle | IfcPresentationStyleAssignment>
  }

  public get Name() : string | null {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 2, true )
    }

    return this.Name_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSTYLEDITEM ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTYLEDITEM
}