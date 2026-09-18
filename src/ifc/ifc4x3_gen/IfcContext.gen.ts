
import { IfcObjectDefinition } from "./index"
import { IfcLabel } from "./index"
import { IfcRepresentationContext } from "./index"
import { IfcUnitAssignment } from "./index"
import {
  stepExtractOptional,
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
export abstract class IfcContext extends IfcObjectDefinition {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCCONTEXT
  }
  private ObjectType_? : string | null
  private LongName_? : string | null
  private Phase_? : string | null
  private RepresentationContexts_? : Array<IfcRepresentationContext> | null
  private UnitsInContext_? : IfcUnitAssignment | null

  public get ObjectType() : string | null {
    if ( this.ObjectType_ === void 0 ) {
      this.ObjectType_ = this.extractString( 4, 4, 2, true )
    }

    return this.ObjectType_ as string | null
  }

  public get LongName() : string | null {
    if ( this.LongName_ === void 0 ) {
      this.LongName_ = this.extractString( 5, 4, 2, true )
    }

    return this.LongName_ as string | null
  }

  public get Phase() : string | null {
    if ( this.Phase_ === void 0 ) {
      this.Phase_ = this.extractString( 6, 4, 2, true )
    }

    return this.Phase_ as string | null
  }

  public get RepresentationContexts() : Array<IfcRepresentationContext> | null {
    if ( this.RepresentationContexts_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 7, 4, 2 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
      }

      const value : Array<IfcRepresentationContext> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcRepresentationContext )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.RepresentationContexts_ = value
    }

    return this.RepresentationContexts_ as Array<IfcRepresentationContext> | null
  }

  public get UnitsInContext() : IfcUnitAssignment | null {
    if ( this.UnitsInContext_ === void 0 ) {
      this.UnitsInContext_ = this.extractElement( 8, 4, 2, true, IfcUnitAssignment )
    }

    return this.UnitsInContext_ as IfcUnitAssignment | null
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcContext.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcContext" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCPROJECT, EntityTypesIfc4x3.IFCPROJECTLIBRARY ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCCONTEXT
}
