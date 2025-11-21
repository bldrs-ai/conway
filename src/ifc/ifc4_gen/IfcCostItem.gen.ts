
import { IfcControl } from "./index"
import { IfcCostItemTypeEnum, IfcCostItemTypeEnumDeserializeStep } from "./index"
import { IfcCostValue } from "./index"
import { IfcPhysicalQuantity } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccostitem.htm */
export  class IfcCostItem extends IfcControl {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCOSTITEM
  }
  private PredefinedType_? : IfcCostItemTypeEnum | null
  private CostValues_? : Array<IfcCostValue> | null
  private CostQuantities_? : Array<IfcPhysicalQuantity> | null

  public get PredefinedType() : IfcCostItemTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 6, 6, 4, IfcCostItemTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcCostItemTypeEnum | null
  }

  public get CostValues() : Array<IfcCostValue> | null {
    if ( this.CostValues_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 7, 6, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
      }

      const value : Array<IfcCostValue> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcCostValue )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.CostValues_ = value
    }

    return this.CostValues_ as Array<IfcCostValue> | null
  }

  public get CostQuantities() : Array<IfcPhysicalQuantity> | null {
    if ( this.CostQuantities_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 8, 6, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
      }

      const value : Array<IfcPhysicalQuantity> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcPhysicalQuantity )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.CostQuantities_ = value
    }

    return this.CostQuantities_ as Array<IfcPhysicalQuantity> | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCOSTITEM ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCOSTITEM
}
