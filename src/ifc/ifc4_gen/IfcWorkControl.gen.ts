
import { IfcControl } from "./index"
import { IfcDateTime } from "./index"
import { IfcPerson } from "./index"
import { IfcLabel } from "./index"
import { IfcDuration } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcworkcontrol.htm */
export abstract class IfcWorkControl extends IfcControl {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCWORKCONTROL
  }
  private CreationDate_? : string
  private Creators_? : Array<IfcPerson> | null
  private Purpose_? : string | null
  private Duration_? : string | null
  private TotalFloat_? : string | null
  private StartTime_? : string
  private FinishTime_? : string | null

  public get CreationDate() : string {
    if ( this.CreationDate_ === void 0 ) {
      this.CreationDate_ = this.extractString( 6, 6, 4, false )
    }

    return this.CreationDate_ as string
  }

  public get Creators() : Array<IfcPerson> | null {
    if ( this.Creators_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 7, 6, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
      }

      const value : Array<IfcPerson> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcPerson )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.Creators_ = value
    }

    return this.Creators_ as Array<IfcPerson> | null
  }

  public get Purpose() : string | null {
    if ( this.Purpose_ === void 0 ) {
      this.Purpose_ = this.extractString( 8, 6, 4, true )
    }

    return this.Purpose_ as string | null
  }

  public get Duration() : string | null {
    if ( this.Duration_ === void 0 ) {
      this.Duration_ = this.extractString( 9, 6, 4, true )
    }

    return this.Duration_ as string | null
  }

  public get TotalFloat() : string | null {
    if ( this.TotalFloat_ === void 0 ) {
      this.TotalFloat_ = this.extractString( 10, 6, 4, true )
    }

    return this.TotalFloat_ as string | null
  }

  public get StartTime() : string {
    if ( this.StartTime_ === void 0 ) {
      this.StartTime_ = this.extractString( 11, 6, 4, false )
    }

    return this.StartTime_ as string
  }

  public get FinishTime() : string | null {
    if ( this.FinishTime_ === void 0 ) {
      this.FinishTime_ = this.extractString( 12, 6, 4, true )
    }

    return this.FinishTime_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCWORKPLAN, EntityTypesIfc.IFCWORKSCHEDULE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCWORKCONTROL
}
