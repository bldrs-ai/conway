
import { IfcIdentifier } from "./index"
import { IfcLabel } from "./index"
import { IfcInteger } from "./index"
import {
  stepExtractOptional,
  stepExtractNumber,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcReference extends StepEntityBase< EntityTypesIfc4x3 > {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCREFERENCE
  }
  private TypeIdentifier_? : string | null
  private AttributeIdentifier_? : string | null
  private InstanceName_? : string | null
  private ListPositions_? : Array< number > | null
  private InnerReference_? : IfcReference | null

  public get TypeIdentifier() : string | null {
    if ( this.TypeIdentifier_ === void 0 ) {
      this.TypeIdentifier_ = this.extractString( 0, 0, 0, true )
    }

    return this.TypeIdentifier_ as string | null
  }

  public get AttributeIdentifier() : string | null {
    if ( this.AttributeIdentifier_ === void 0 ) {
      this.AttributeIdentifier_ = this.extractString( 1, 0, 0, true )
    }

    return this.AttributeIdentifier_ as string | null
  }

  public get InstanceName() : string | null {
    if ( this.InstanceName_ === void 0 ) {
      this.InstanceName_ = this.extractString( 2, 0, 0, true )
    }

    return this.InstanceName_ as string | null
  }

  public get ListPositions() : Array< number > | null {
    if ( this.ListPositions_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 3, 0, 0 )
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

      this.ListPositions_ = value
    }

    return this.ListPositions_ as Array< number > | null
  }

  public get InnerReference() : IfcReference | null {
    if ( this.InnerReference_ === void 0 ) {
      this.InnerReference_ = this.extractElement( 4, 0, 0, true, IfcReference )
    }

    return this.InnerReference_ as IfcReference | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcReference.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcReference" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCREFERENCE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCREFERENCE
}
