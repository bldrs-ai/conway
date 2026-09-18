
import { IfcPersonAndOrganization } from "./index"
import { IfcApplication } from "./index"
import { IfcStateEnum, IfcStateEnumDeserializeStep } from "./index"
import { IfcChangeActionEnum, IfcChangeActionEnumDeserializeStep } from "./index"
import { IfcTimeStamp } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcOwnerHistory extends StepEntityBase< EntityTypesIfc4x3 > {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCOWNERHISTORY
  }
  private OwningUser_? : IfcPersonAndOrganization
  private OwningApplication_? : IfcApplication
  private State_? : IfcStateEnum | null
  private ChangeAction_? : IfcChangeActionEnum | null
  private LastModifiedDate_? : number | null
  private LastModifyingUser_? : IfcPersonAndOrganization | null
  private LastModifyingApplication_? : IfcApplication | null
  private CreationDate_? : number

  public get OwningUser() : IfcPersonAndOrganization {
    if ( this.OwningUser_ === void 0 ) {
      this.OwningUser_ = this.extractElement( 0, 0, 0, false, IfcPersonAndOrganization )
    }

    return this.OwningUser_ as IfcPersonAndOrganization
  }

  public get OwningApplication() : IfcApplication {
    if ( this.OwningApplication_ === void 0 ) {
      this.OwningApplication_ = this.extractElement( 1, 0, 0, false, IfcApplication )
    }

    return this.OwningApplication_ as IfcApplication
  }

  public get State() : IfcStateEnum | null {
    if ( this.State_ === void 0 ) {
      this.State_ = this.extractLambda( 2, 0, 0, IfcStateEnumDeserializeStep, true )
    }

    return this.State_ as IfcStateEnum | null
  }

  public get ChangeAction() : IfcChangeActionEnum | null {
    if ( this.ChangeAction_ === void 0 ) {
      this.ChangeAction_ = this.extractLambda( 3, 0, 0, IfcChangeActionEnumDeserializeStep, true )
    }

    return this.ChangeAction_ as IfcChangeActionEnum | null
  }

  public get LastModifiedDate() : number | null {
    if ( this.LastModifiedDate_ === void 0 ) {
      this.LastModifiedDate_ = this.extractNumber( 4, 0, 0, true )
    }

    return this.LastModifiedDate_ as number | null
  }

  public get LastModifyingUser() : IfcPersonAndOrganization | null {
    if ( this.LastModifyingUser_ === void 0 ) {
      this.LastModifyingUser_ = this.extractElement( 5, 0, 0, true, IfcPersonAndOrganization )
    }

    return this.LastModifyingUser_ as IfcPersonAndOrganization | null
  }

  public get LastModifyingApplication() : IfcApplication | null {
    if ( this.LastModifyingApplication_ === void 0 ) {
      this.LastModifyingApplication_ = this.extractElement( 6, 0, 0, true, IfcApplication )
    }

    return this.LastModifyingApplication_ as IfcApplication | null
  }

  public get CreationDate() : number {
    if ( this.CreationDate_ === void 0 ) {
      this.CreationDate_ = this.extractNumber( 7, 0, 0, false )
    }

    return this.CreationDate_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcOwnerHistory.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcOwnerHistory" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCOWNERHISTORY ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCOWNERHISTORY
}
