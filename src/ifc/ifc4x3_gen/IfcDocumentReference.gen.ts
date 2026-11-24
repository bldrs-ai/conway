
import { IfcExternalReference } from "./index"
import { IfcText } from "./index"
import { IfcDocumentInformation } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcDocumentReference extends IfcExternalReference {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCDOCUMENTREFERENCE
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcDocumentReference.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcDocumentReference" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCDOCUMENTREFERENCE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCDOCUMENTREFERENCE
}
