
import { IfcOrganization } from "./index"
import { IfcLabel } from "./index"
import { IfcIdentifier } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcApplication extends StepEntityBase< EntityTypesIfc4x3 > {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCAPPLICATION
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcApplication.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcApplication" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCAPPLICATION ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCAPPLICATION
}
