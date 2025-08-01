
import { IfcProduct } from "./index"
import { IfcGridAxis } from "./index"
import { IfcGridTypeEnum, IfcGridTypeEnumDeserializeStep } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcgrid.htm */
export  class IfcGrid extends IfcProduct {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCGRID
  }
  private UAxes_? : Array<IfcGridAxis>
  private VAxes_? : Array<IfcGridAxis>
  private WAxes_? : Array<IfcGridAxis> | null
  private PredefinedType_? : IfcGridTypeEnum | null

  public get UAxes() : Array<IfcGridAxis> {
    if ( this.UAxes_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 7, 7, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcGridAxis> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcGridAxis )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.UAxes_ = value
    }

    return this.UAxes_ as Array<IfcGridAxis>
  }

  public get VAxes() : Array<IfcGridAxis> {
    if ( this.VAxes_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 8, 7, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcGridAxis> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcGridAxis )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.VAxes_ = value
    }

    return this.VAxes_ as Array<IfcGridAxis>
  }

  public get WAxes() : Array<IfcGridAxis> | null {
    if ( this.WAxes_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 9, 7, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
      }

      const value : Array<IfcGridAxis> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcGridAxis )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.WAxes_ = value
    }

    return this.WAxes_ as Array<IfcGridAxis> | null
  }

  public get PredefinedType() : IfcGridTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 10, 7, 4, IfcGridTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcGridTypeEnum | null
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCGRID ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCGRID
}
