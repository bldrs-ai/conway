
import { IfcPropertyTemplate } from "./index"
import { IfcLabel } from "./index"
import { IfcComplexPropertyTemplateTypeEnum, IfcComplexPropertyTemplateTypeEnumDeserializeStep } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccomplexpropertytemplate.htm */
export  class IfcComplexPropertyTemplate extends IfcPropertyTemplate {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCOMPLEXPROPERTYTEMPLATE
  }
  private UsageName_? : string | null
  private TemplateType_? : IfcComplexPropertyTemplateTypeEnum | null
  private HasPropertyTemplates_? : Array<IfcPropertyTemplate> | null

  public get UsageName() : string | null {
    if ( this.UsageName_ === void 0 ) {
      this.UsageName_ = this.extractString( 4, 4, 4, true )
    }

    return this.UsageName_ as string | null
  }

  public get TemplateType() : IfcComplexPropertyTemplateTypeEnum | null {
    if ( this.TemplateType_ === void 0 ) {
      this.TemplateType_ = this.extractLambda( 5, 4, 4, IfcComplexPropertyTemplateTypeEnumDeserializeStep, true )
    }

    return this.TemplateType_ as IfcComplexPropertyTemplateTypeEnum | null
  }

  public get HasPropertyTemplates() : Array<IfcPropertyTemplate> | null {
    if ( this.HasPropertyTemplates_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 6, 4, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
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

    return this.HasPropertyTemplates_ as Array<IfcPropertyTemplate> | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCOMPLEXPROPERTYTEMPLATE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCOMPLEXPROPERTYTEMPLATE
}
