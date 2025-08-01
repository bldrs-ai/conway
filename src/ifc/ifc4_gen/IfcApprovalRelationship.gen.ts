
import { IfcResourceLevelRelationship } from "./index"
import { IfcApproval } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcapprovalrelationship.htm */
export  class IfcApprovalRelationship extends IfcResourceLevelRelationship {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCAPPROVALRELATIONSHIP
  }
  private RelatingApproval_? : IfcApproval
  private RelatedApprovals_? : Array<IfcApproval>

  public get RelatingApproval() : IfcApproval {
    if ( this.RelatingApproval_ === void 0 ) {
      this.RelatingApproval_ = this.extractElement( 2, 2, 1, false, IfcApproval )
    }

    return this.RelatingApproval_ as IfcApproval
  }

  public get RelatedApprovals() : Array<IfcApproval> {
    if ( this.RelatedApprovals_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 3, 2, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcApproval> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcApproval )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.RelatedApprovals_ = value
    }

    return this.RelatedApprovals_ as Array<IfcApproval>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCAPPROVALRELATIONSHIP ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCAPPROVALRELATIONSHIP
}
