
import { IfcResourceLevelRelationship } from "./index"
import { IfcMaterial } from "./index"
import { IfcLabel } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcmaterialrelationship.htm */
export  class IfcMaterialRelationship extends IfcResourceLevelRelationship {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCMATERIALRELATIONSHIP
  }
  private RelatingMaterial_? : IfcMaterial
  private RelatedMaterials_? : Array<IfcMaterial>
  private Expression_? : string | null

  public get RelatingMaterial() : IfcMaterial {
    if ( this.RelatingMaterial_ === void 0 ) {
      this.RelatingMaterial_ = this.extractElement( 2, 2, 1, false, IfcMaterial )
    }

    return this.RelatingMaterial_ as IfcMaterial
  }

  public get RelatedMaterials() : Array<IfcMaterial> {
    if ( this.RelatedMaterials_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 3, 2, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcMaterial> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcMaterial )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.RelatedMaterials_ = value
    }

    return this.RelatedMaterials_ as Array<IfcMaterial>
  }

  public get Expression() : string | null {
    if ( this.Expression_ === void 0 ) {
      this.Expression_ = this.extractString( 4, 2, 1, true )
    }

    return this.Expression_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCMATERIALRELATIONSHIP ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCMATERIALRELATIONSHIP
}
