
import { IfcMaterialDefinition } from "./index"
import { IfcLabel } from "./index"
import { IfcText } from "./index"
import { IfcMaterialProfile } from "./index"
import { IfcCompositeProfileDef } from "./index"
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
export  class IfcMaterialProfileSet extends IfcMaterialDefinition {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCMATERIALPROFILESET
  }
  private Name_? : string | null
  private Description_? : string | null
  private MaterialProfiles_? : Array<IfcMaterialProfile>
  private CompositeProfile_? : IfcCompositeProfileDef | null

  public get Name() : string | null {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 0, 0, 1, true )
    }

    return this.Name_ as string | null
  }

  public get Description() : string | null {
    if ( this.Description_ === void 0 ) {
      this.Description_ = this.extractString( 1, 0, 1, true )
    }

    return this.Description_ as string | null
  }

  public get MaterialProfiles() : Array<IfcMaterialProfile> {
    if ( this.MaterialProfiles_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 2, 0, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcMaterialProfile> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcMaterialProfile )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.MaterialProfiles_ = value
    }

    return this.MaterialProfiles_ as Array<IfcMaterialProfile>
  }

  public get CompositeProfile() : IfcCompositeProfileDef | null {
    if ( this.CompositeProfile_ === void 0 ) {
      this.CompositeProfile_ = this.extractElement( 3, 0, 1, true, IfcCompositeProfileDef )
    }

    return this.CompositeProfile_ as IfcCompositeProfileDef | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcMaterialProfileSet.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcMaterialProfileSet" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCMATERIALPROFILESET ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCMATERIALPROFILESET
}
