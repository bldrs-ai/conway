
import { IfcPropertyTemplate } from "./index"
import { IfcSimplePropertyTemplateTypeEnum, IfcSimplePropertyTemplateTypeEnumDeserializeStep } from "./index"
import { IfcLabel } from "./index"
import { IfcPropertyEnumeration } from "./index"
import { IfcDerivedUnit } from "./index"
import { IfcMonetaryUnit } from "./index"
import { IfcNamedUnit } from "./index"
import { IfcStateEnum, IfcStateEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcsimplepropertytemplate.htm */
export  class IfcSimplePropertyTemplate extends IfcPropertyTemplate {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSIMPLEPROPERTYTEMPLATE
  }
  private TemplateType_? : IfcSimplePropertyTemplateTypeEnum | null
  private PrimaryMeasureType_? : string | null
  private SecondaryMeasureType_? : string | null
  private Enumerators_? : IfcPropertyEnumeration | null
  private PrimaryUnit_? : IfcDerivedUnit | IfcMonetaryUnit | IfcNamedUnit | null
  private SecondaryUnit_? : IfcDerivedUnit | IfcMonetaryUnit | IfcNamedUnit | null
  private Expression_? : string | null
  private AccessState_? : IfcStateEnum | null

  public get TemplateType() : IfcSimplePropertyTemplateTypeEnum | null {
    if ( this.TemplateType_ === void 0 ) {
      this.TemplateType_ = this.extractLambda( 4, 4, 4, IfcSimplePropertyTemplateTypeEnumDeserializeStep, true )
    }

    return this.TemplateType_ as IfcSimplePropertyTemplateTypeEnum | null
  }

  public get PrimaryMeasureType() : string | null {
    if ( this.PrimaryMeasureType_ === void 0 ) {
      this.PrimaryMeasureType_ = this.extractString( 5, 4, 4, true )
    }

    return this.PrimaryMeasureType_ as string | null
  }

  public get SecondaryMeasureType() : string | null {
    if ( this.SecondaryMeasureType_ === void 0 ) {
      this.SecondaryMeasureType_ = this.extractString( 6, 4, 4, true )
    }

    return this.SecondaryMeasureType_ as string | null
  }

  public get Enumerators() : IfcPropertyEnumeration | null {
    if ( this.Enumerators_ === void 0 ) {
      this.Enumerators_ = this.extractElement( 7, 4, 4, true, IfcPropertyEnumeration )
    }

    return this.Enumerators_ as IfcPropertyEnumeration | null
  }

  public get PrimaryUnit() : IfcDerivedUnit | IfcMonetaryUnit | IfcNamedUnit | null {
    if ( this.PrimaryUnit_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
        this.extractReference( 8, 4, 4, true )

      if ( !( value instanceof IfcDerivedUnit ) && !( value instanceof IfcMonetaryUnit ) && !( value instanceof IfcNamedUnit ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.PrimaryUnit_ = value as (IfcDerivedUnit | IfcMonetaryUnit | IfcNamedUnit)

    }

    return this.PrimaryUnit_ as IfcDerivedUnit | IfcMonetaryUnit | IfcNamedUnit | null
  }

  public get SecondaryUnit() : IfcDerivedUnit | IfcMonetaryUnit | IfcNamedUnit | null {
    if ( this.SecondaryUnit_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
        this.extractReference( 9, 4, 4, true )

      if ( !( value instanceof IfcDerivedUnit ) && !( value instanceof IfcMonetaryUnit ) && !( value instanceof IfcNamedUnit ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.SecondaryUnit_ = value as (IfcDerivedUnit | IfcMonetaryUnit | IfcNamedUnit)

    }

    return this.SecondaryUnit_ as IfcDerivedUnit | IfcMonetaryUnit | IfcNamedUnit | null
  }

  public get Expression() : string | null {
    if ( this.Expression_ === void 0 ) {
      this.Expression_ = this.extractString( 10, 4, 4, true )
    }

    return this.Expression_ as string | null
  }

  public get AccessState() : IfcStateEnum | null {
    if ( this.AccessState_ === void 0 ) {
      this.AccessState_ = this.extractLambda( 11, 4, 4, IfcStateEnumDeserializeStep, true )
    }

    return this.AccessState_ as IfcStateEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSIMPLEPROPERTYTEMPLATE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSIMPLEPROPERTYTEMPLATE
}
