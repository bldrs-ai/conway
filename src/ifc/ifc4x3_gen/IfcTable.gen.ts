
import { IfcLabel } from "./index"
import { IfcTableRow } from "./index"
import { IfcTableColumn } from "./index"
import { IfcInteger } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
  HIINDEX,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcTable extends StepEntityBase< EntityTypesIfc4x3 > {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCTABLE
  }
  private Name_? : string | null
  private Rows_? : Array<IfcTableRow> | null
  private Columns_? : Array<IfcTableColumn> | null

  public get Name() : string | null {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 0, 0, 0, true )
    }

    return this.Name_ as string | null
  }

  public get Rows() : Array<IfcTableRow> | null {
    if ( this.Rows_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 0, 0 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
      }

      const value : Array<IfcTableRow> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcTableRow )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.Rows_ = value
    }

    return this.Rows_ as Array<IfcTableRow> | null
  }

  public get Columns() : Array<IfcTableColumn> | null {
    if ( this.Columns_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 2, 0, 0 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
      }

      const value : Array<IfcTableColumn> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcTableColumn )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.Columns_ = value
    }

    return this.Columns_ as Array<IfcTableColumn> | null
  }

  public get NumberOfCellsInRow() : number {
    return HIINDEX(this?.Rows?.[1 - 1].RowCells);
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcTable.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcTable" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCTABLE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCTABLE
}
