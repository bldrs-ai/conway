
import { IfcStructuralLoadOrResult } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcRatioMeasure } from "./index"
import {
  stepExtractOptional,
  stepExtractNumber,
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcsurfacereinforcementarea.htm */
export  class IfcSurfaceReinforcementArea extends IfcStructuralLoadOrResult {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSURFACEREINFORCEMENTAREA
  }
  private SurfaceReinforcement1_? : Array< number > | null
  private SurfaceReinforcement2_? : Array< number > | null
  private ShearReinforcement_? : number | null

  public get SurfaceReinforcement1() : Array< number > | null {
    if ( this.SurfaceReinforcement1_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 1, 2 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
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

      this.SurfaceReinforcement1_ = value
    }

    return this.SurfaceReinforcement1_ as Array< number > | null
  }

  public get SurfaceReinforcement2() : Array< number > | null {
    if ( this.SurfaceReinforcement2_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 2, 1, 2 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
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

      this.SurfaceReinforcement2_ = value
    }

    return this.SurfaceReinforcement2_ as Array< number > | null
  }

  public get ShearReinforcement() : number | null {
    if ( this.ShearReinforcement_ === void 0 ) {
      this.ShearReinforcement_ = this.extractNumber( 3, 1, 2, true )
    }

    return this.ShearReinforcement_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSURFACEREINFORCEMENTAREA ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSURFACEREINFORCEMENTAREA
}
