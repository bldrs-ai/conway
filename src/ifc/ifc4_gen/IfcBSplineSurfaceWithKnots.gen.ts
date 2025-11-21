
import { IfcBSplineSurface } from "./index"
import { IfcInteger } from "./index"
import { IfcParameterValue } from "./index"
import { IfcKnotType, IfcKnotTypeDeserializeStep } from "./index"
import {
  stepExtractOptional,
  stepExtractNumber,
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcbsplinesurfacewithknots.htm */
export  class IfcBSplineSurfaceWithKnots extends IfcBSplineSurface {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCBSPLINESURFACEWITHKNOTS
  }
  private UMultiplicities_? : Array< number >
  private VMultiplicities_? : Array< number >
  private UKnots_? : Array< number >
  private VKnots_? : Array< number >
  private KnotSpec_? : IfcKnotType

  public get UMultiplicities() : Array< number > {
    if ( this.UMultiplicities_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 7, 7, 5 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<number> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = stepExtractNumber( buffer, cursor, endCursor )

        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.UMultiplicities_ = value
    }

    return this.UMultiplicities_ as Array< number >
  }

  public get VMultiplicities() : Array< number > {
    if ( this.VMultiplicities_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 8, 7, 5 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<number> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = stepExtractNumber( buffer, cursor, endCursor )

        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.VMultiplicities_ = value
    }

    return this.VMultiplicities_ as Array< number >
  }

  public get UKnots() : Array< number > {
    if ( this.UKnots_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 9, 7, 5 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<number> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = stepExtractNumber( buffer, cursor, endCursor )

        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.UKnots_ = value
    }

    return this.UKnots_ as Array< number >
  }

  public get VKnots() : Array< number > {
    if ( this.VKnots_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 10, 7, 5 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<number> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = stepExtractNumber( buffer, cursor, endCursor )

        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.VKnots_ = value
    }

    return this.VKnots_ as Array< number >
  }

  public get KnotSpec() : IfcKnotType {
    if ( this.KnotSpec_ === void 0 ) {
      this.KnotSpec_ = this.extractLambda( 11, 7, 5, IfcKnotTypeDeserializeStep, false )
    }

    return this.KnotSpec_ as IfcKnotType
  }

  public get KnotVUpper() : number {
    return SIZEOF(this?.VKnots);
  }

  public get KnotUUpper() : number {
    return SIZEOF(this?.UKnots);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCBSPLINESURFACEWITHKNOTS, EntityTypesIfc.IFCRATIONALBSPLINESURFACEWITHKNOTS ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCBSPLINESURFACEWITHKNOTS
}
