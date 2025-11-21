
import { IfcPresentationStyle } from "./index"
import { IfcTextStyleForDefinedFont } from "./index"
import { IfcTextStyleTextModel } from "./index"
import { IfcExternallyDefinedTextFont } from "./index"
import { IfcPreDefinedTextFont } from "./index"
import { IfcBoolean } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctextstyle.htm */
export  class IfcTextStyle extends IfcPresentationStyle {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTEXTSTYLE
  }
  private TextCharacterAppearance_? : IfcTextStyleForDefinedFont | null
  private TextStyle_? : IfcTextStyleTextModel | null
  private TextFontStyle_? : IfcExternallyDefinedTextFont | IfcPreDefinedTextFont
  private ModelOrDraughting_? : boolean | null

  public get TextCharacterAppearance() : IfcTextStyleForDefinedFont | null {
    if ( this.TextCharacterAppearance_ === void 0 ) {
      this.TextCharacterAppearance_ = this.extractElement( 1, 1, 1, true, IfcTextStyleForDefinedFont )
    }

    return this.TextCharacterAppearance_ as IfcTextStyleForDefinedFont | null
  }

  public get TextStyle() : IfcTextStyleTextModel | null {
    if ( this.TextStyle_ === void 0 ) {
      this.TextStyle_ = this.extractElement( 2, 1, 1, true, IfcTextStyleTextModel )
    }

    return this.TextStyle_ as IfcTextStyleTextModel | null
  }

  public get TextFontStyle() : IfcExternallyDefinedTextFont | IfcPreDefinedTextFont {
    if ( this.TextFontStyle_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc > = 
        this.extractReference( 3, 1, 1, false )

      if ( !( value instanceof IfcExternallyDefinedTextFont ) && !( value instanceof IfcPreDefinedTextFont ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.TextFontStyle_ = value as (IfcExternallyDefinedTextFont | IfcPreDefinedTextFont)

    }

    return this.TextFontStyle_ as IfcExternallyDefinedTextFont | IfcPreDefinedTextFont
  }

  public get ModelOrDraughting() : boolean | null {
    if ( this.ModelOrDraughting_ === void 0 ) {
      this.ModelOrDraughting_ = this.extractBoolean( 4, 1, 1, true )
    }

    return this.ModelOrDraughting_ as boolean | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCTEXTSTYLE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTEXTSTYLE
}
