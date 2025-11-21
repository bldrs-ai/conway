
import { IfcExternalReference } from "./index"
import { IfcText } from "./index"
import { IfcDocumentInformation } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcdocumentreference.htm */
export  class IfcDocumentReference extends IfcExternalReference {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCDOCUMENTREFERENCE
  }
  private Description_? : string | null
  private ReferencedDocument_? : IfcDocumentInformation | null

  public get Description() : string | null {
    if ( this.Description_ === void 0 ) {
      this.Description_ = this.extractString( 3, 3, 1, true )
    }

    return this.Description_ as string | null
  }

  public get ReferencedDocument() : IfcDocumentInformation | null {
    if ( this.ReferencedDocument_ === void 0 ) {
      this.ReferencedDocument_ = this.extractElement( 4, 3, 1, true, IfcDocumentInformation )
    }

    return this.ReferencedDocument_ as IfcDocumentInformation | null
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCDOCUMENTREFERENCE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCDOCUMENTREFERENCE
}
