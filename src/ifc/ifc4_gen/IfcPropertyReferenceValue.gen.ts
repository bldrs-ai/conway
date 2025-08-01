
import { IfcSimpleProperty } from "./index"
import { IfcText } from "./index"
import { IfcAddress } from "./index"
import { IfcAppliedValue } from "./index"
import { IfcExternalReference } from "./index"
import { IfcMaterialDefinition } from "./index"
import { IfcOrganization } from "./index"
import { IfcPerson } from "./index"
import { IfcPersonAndOrganization } from "./index"
import { IfcTable } from "./index"
import { IfcTimeSeries } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcpropertyreferencevalue.htm */
export  class IfcPropertyReferenceValue extends IfcSimpleProperty {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPROPERTYREFERENCEVALUE
  }
  private UsageName_? : string | null
  private PropertyReference_? : IfcAddress | IfcAppliedValue | IfcExternalReference | IfcMaterialDefinition | IfcOrganization | IfcPerson | IfcPersonAndOrganization | IfcTable | IfcTimeSeries | null

  public get UsageName() : string | null {
    if ( this.UsageName_ === void 0 ) {
      this.UsageName_ = this.extractString( 2, 2, 3, true )
    }

    return this.UsageName_ as string | null
  }

  public get PropertyReference() : IfcAddress | IfcAppliedValue | IfcExternalReference | IfcMaterialDefinition | IfcOrganization | IfcPerson | IfcPersonAndOrganization | IfcTable | IfcTimeSeries | null {
    if ( this.PropertyReference_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
        this.extractReference( 3, 2, 3, true )

      if ( !( value instanceof IfcAddress ) && !( value instanceof IfcAppliedValue ) && !( value instanceof IfcExternalReference ) && !( value instanceof IfcMaterialDefinition ) && !( value instanceof IfcOrganization ) && !( value instanceof IfcPerson ) && !( value instanceof IfcPersonAndOrganization ) && !( value instanceof IfcTable ) && !( value instanceof IfcTimeSeries ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.PropertyReference_ = value as (IfcAddress | IfcAppliedValue | IfcExternalReference | IfcMaterialDefinition | IfcOrganization | IfcPerson | IfcPersonAndOrganization | IfcTable | IfcTimeSeries)

    }

    return this.PropertyReference_ as IfcAddress | IfcAppliedValue | IfcExternalReference | IfcMaterialDefinition | IfcOrganization | IfcPerson | IfcPersonAndOrganization | IfcTable | IfcTimeSeries | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPROPERTYREFERENCEVALUE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPROPERTYREFERENCEVALUE
}
