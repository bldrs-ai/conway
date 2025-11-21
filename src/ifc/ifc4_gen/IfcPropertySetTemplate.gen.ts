
import { IfcPropertyTemplateDefinition } from "./index"
import { IfcPropertySetTemplateTypeEnum, IfcPropertySetTemplateTypeEnumDeserializeStep } from "./index"
import { IfcIdentifier } from "./index"
import { IfcPropertyTemplate } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcpropertysettemplate.htm */
export  class IfcPropertySetTemplate extends IfcPropertyTemplateDefinition {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPROPERTYSETTEMPLATE
  }
  private TemplateType_? : IfcPropertySetTemplateTypeEnum | null
  private ApplicableEntity_? : string | null
  private HasPropertyTemplates_? : Array<IfcPropertyTemplate>

  public get TemplateType() : IfcPropertySetTemplateTypeEnum | null {
    if ( this.TemplateType_ === void 0 ) {
      this.TemplateType_ = this.extractLambda( 4, 4, 3, IfcPropertySetTemplateTypeEnumDeserializeStep, true )
    }

    return this.TemplateType_ as IfcPropertySetTemplateTypeEnum | null
  }

  public get ApplicableEntity() : string | null {
    if ( this.ApplicableEntity_ === void 0 ) {
      this.ApplicableEntity_ = this.extractString( 5, 4, 3, true )
    }

    return this.ApplicableEntity_ as string | null
  }

  public get HasPropertyTemplates() : Array<IfcPropertyTemplate> {
    if ( this.HasPropertyTemplates_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 6, 4, 3 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcPropertyTemplate> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcPropertyTemplate )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.HasPropertyTemplates_ = value
    }

    return this.HasPropertyTemplates_ as Array<IfcPropertyTemplate>
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPROPERTYSETTEMPLATE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPROPERTYSETTEMPLATE
}
