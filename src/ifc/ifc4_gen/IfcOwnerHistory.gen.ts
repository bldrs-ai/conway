
import { IfcPersonAndOrganization } from "./index"
import { IfcApplication } from "./index"
import { IfcStateEnum, IfcStateEnumDeserializeStep } from "./index"
import { IfcChangeActionEnum, IfcChangeActionEnumDeserializeStep } from "./index"
import { IfcTimeStamp } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcownerhistory.htm */
export  class IfcOwnerHistory extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCOWNERHISTORY
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCOWNERHISTORY ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCOWNERHISTORY
}
