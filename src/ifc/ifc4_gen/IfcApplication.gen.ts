
import { IfcOrganization } from "./index"
import { IfcLabel } from "./index"
import { IfcIdentifier } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcapplication.htm */
export  class IfcApplication extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCAPPLICATION
  }
  private ApplicationDeveloper_? : IfcOrganization
  private Version_? : string
  private ApplicationFullName_? : string
  private ApplicationIdentifier_? : string

  public get ApplicationDeveloper() : IfcOrganization {
    if ( this.ApplicationDeveloper_ === void 0 ) {
      this.ApplicationDeveloper_ = this.extractElement( 0, 0, 0, false, IfcOrganization )
    }

    return this.ApplicationDeveloper_ as IfcOrganization
  }

  public get Version() : string {
    if ( this.Version_ === void 0 ) {
      this.Version_ = this.extractString( 1, 0, 0, false )
    }

    return this.Version_ as string
  }

  public get ApplicationFullName() : string {
    if ( this.ApplicationFullName_ === void 0 ) {
      this.ApplicationFullName_ = this.extractString( 2, 0, 0, false )
    }

    return this.ApplicationFullName_ as string
  }

  public get ApplicationIdentifier() : string {
    if ( this.ApplicationIdentifier_ === void 0 ) {
      this.ApplicationIdentifier_ = this.extractString( 3, 0, 0, false )
    }

    return this.ApplicationIdentifier_ as string
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCAPPLICATION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCAPPLICATION
}
