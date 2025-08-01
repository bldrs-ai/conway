
import { IfcExternalInformation } from "./index"
import { IfcLabel } from "./index"
import { IfcOrganization } from "./index"
import { IfcPerson } from "./index"
import { IfcPersonAndOrganization } from "./index"
import { IfcDateTime } from "./index"
import { IfcURIReference } from "./index"
import { IfcText } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifclibraryinformation.htm */
export  class IfcLibraryInformation extends IfcExternalInformation {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCLIBRARYINFORMATION
  }
  private Name_? : string
  private Version_? : string | null
  private Publisher_? : IfcOrganization | IfcPerson | IfcPersonAndOrganization | null
  private VersionDate_? : string | null
  private Location_? : string | null
  private Description_? : string | null

  public get Name() : string {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 0, 0, 1, false )
    }

    return this.Name_ as string
  }

  public get Version() : string | null {
    if ( this.Version_ === void 0 ) {
      this.Version_ = this.extractString( 1, 0, 1, true )
    }

    return this.Version_ as string | null
  }

  public get Publisher() : IfcOrganization | IfcPerson | IfcPersonAndOrganization | null {
    if ( this.Publisher_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
        this.extractReference( 2, 0, 1, true )

      if ( !( value instanceof IfcOrganization ) && !( value instanceof IfcPerson ) && !( value instanceof IfcPersonAndOrganization ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.Publisher_ = value as (IfcOrganization | IfcPerson | IfcPersonAndOrganization)

    }

    return this.Publisher_ as IfcOrganization | IfcPerson | IfcPersonAndOrganization | null
  }

  public get VersionDate() : string | null {
    if ( this.VersionDate_ === void 0 ) {
      this.VersionDate_ = this.extractString( 3, 0, 1, true )
    }

    return this.VersionDate_ as string | null
  }

  public get Location() : string | null {
    if ( this.Location_ === void 0 ) {
      this.Location_ = this.extractString( 4, 0, 1, true )
    }

    return this.Location_ as string | null
  }

  public get Description() : string | null {
    if ( this.Description_ === void 0 ) {
      this.Description_ = this.extractString( 5, 0, 1, true )
    }

    return this.Description_ as string | null
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCLIBRARYINFORMATION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCLIBRARYINFORMATION
}
