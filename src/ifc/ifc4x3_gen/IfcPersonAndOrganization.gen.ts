
import { IfcPerson } from "./index"
import { IfcOrganization } from "./index"
import { IfcActorRole } from "./index"
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
export  class IfcPersonAndOrganization extends StepEntityBase< EntityTypesIfc4x3 > {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCPERSONANDORGANIZATION
  }
  private ThePerson_? : IfcPerson
  private TheOrganization_? : IfcOrganization
  private Roles_? : Array<IfcActorRole> | null

  public get ThePerson() : IfcPerson {
    if ( this.ThePerson_ === void 0 ) {
      this.ThePerson_ = this.extractElement( 0, 0, 0, false, IfcPerson )
    }

    return this.ThePerson_ as IfcPerson
  }

  public get TheOrganization() : IfcOrganization {
    if ( this.TheOrganization_ === void 0 ) {
      this.TheOrganization_ = this.extractElement( 1, 0, 0, false, IfcOrganization )
    }

    return this.TheOrganization_ as IfcOrganization
  }

  public get Roles() : Array<IfcActorRole> | null {
    if ( this.Roles_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 2, 0, 0 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
      }

      const value : Array<IfcActorRole> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcActorRole )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.Roles_ = value
    }

    return this.Roles_ as Array<IfcActorRole> | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcPersonAndOrganization.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcPersonAndOrganization" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCPERSONANDORGANIZATION ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCPERSONANDORGANIZATION
}
