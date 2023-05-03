
import { IfcIdentifier } from "./index"
import { IfcLabel } from "./index"
import { IfcText } from "./index"
import { IfcDateTime } from "./index"
import { IfcOrganization } from "./index"
import { IfcPerson } from "./index"
import { IfcPersonAndOrganization } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../core/step_entity_internal_reference'
import StepEntityBase from '../../core/step_entity_base'
import StepModelBase from '../../core/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcapproval.htm */
export  class IfcApproval extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCAPPROVAL
  }
  private Identifier_? : string | null
  private Name_? : string | null
  private Description_? : string | null
  private TimeOfApproval_? : string | null
  private Status_? : string | null
  private Level_? : string | null
  private Qualifier_? : string | null
  private RequestingApproval_? : IfcOrganization | IfcPerson | IfcPersonAndOrganization | null
  private GivingApproval_? : IfcOrganization | IfcPerson | IfcPersonAndOrganization | null

  public get Identifier() : string | null {
    if ( this.Identifier_ === void 0 ) {
      this.Identifier_ = this.extractString( 0, true )
    }

    return this.Identifier_ as string | null
  }

  public get Name() : string | null {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 1, true )
    }

    return this.Name_ as string | null
  }

  public get Description() : string | null {
    if ( this.Description_ === void 0 ) {
      this.Description_ = this.extractString( 2, true )
    }

    return this.Description_ as string | null
  }

  public get TimeOfApproval() : string | null {
    if ( this.TimeOfApproval_ === void 0 ) {
      this.TimeOfApproval_ = this.extractString( 3, true )
    }

    return this.TimeOfApproval_ as string | null
  }

  public get Status() : string | null {
    if ( this.Status_ === void 0 ) {
      this.Status_ = this.extractString( 4, true )
    }

    return this.Status_ as string | null
  }

  public get Level() : string | null {
    if ( this.Level_ === void 0 ) {
      this.Level_ = this.extractString( 5, true )
    }

    return this.Level_ as string | null
  }

  public get Qualifier() : string | null {
    if ( this.Qualifier_ === void 0 ) {
      this.Qualifier_ = this.extractString( 6, true )
    }

    return this.Qualifier_ as string | null
  }

  public get RequestingApproval() : IfcOrganization | IfcPerson | IfcPersonAndOrganization | null {
    if ( this.RequestingApproval_ === void 0 ) {
      this.RequestingApproval_ = this.extractLambda( 7, (buffer, cursor, endCursor) => {

      const value : StepEntityBase< EntityTypesIfc > | undefined =
        this.extractBufferReference( buffer, cursor, endCursor )

      if ( !( value instanceof IfcOrganization ) && !( value instanceof IfcPerson ) && !( value instanceof IfcPersonAndOrganization ) ) {
        return ( void 0 )
      }
      return value as (IfcOrganization | IfcPerson | IfcPersonAndOrganization)
}, true )
    }

    return this.RequestingApproval_ as IfcOrganization | IfcPerson | IfcPersonAndOrganization | null
  }

  public get GivingApproval() : IfcOrganization | IfcPerson | IfcPersonAndOrganization | null {
    if ( this.GivingApproval_ === void 0 ) {
      this.GivingApproval_ = this.extractLambda( 8, (buffer, cursor, endCursor) => {

      const value : StepEntityBase< EntityTypesIfc > | undefined =
        this.extractBufferReference( buffer, cursor, endCursor )

      if ( !( value instanceof IfcOrganization ) && !( value instanceof IfcPerson ) && !( value instanceof IfcPersonAndOrganization ) ) {
        return ( void 0 )
      }
      return value as (IfcOrganization | IfcPerson | IfcPersonAndOrganization)
}, true )
    }

    return this.GivingApproval_ as IfcOrganization | IfcPerson | IfcPersonAndOrganization | null
  }





  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCAPPROVAL ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCAPPROVAL
}
