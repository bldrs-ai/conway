
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
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcreference.htm */
export  class IfcReference extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCREFERENCE
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCREFERENCE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCREFERENCE
}
