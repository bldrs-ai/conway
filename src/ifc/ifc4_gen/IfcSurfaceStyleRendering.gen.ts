
import { IfcSurfaceStyleShading } from "./index"
import { IfcColourRgb } from "./index"
import { IfcNormalisedRatioMeasure } from "./index"
import { IfcSpecularExponent } from "./index"
import { IfcSpecularRoughness } from "./index"
import { IfcReflectanceMethodEnum, IfcReflectanceMethodEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcsurfacestylerendering.htm */
export  class IfcSurfaceStyleRendering extends IfcSurfaceStyleShading {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSURFACESTYLERENDERING
  }
  private DiffuseColour_? : IfcColourRgb | IfcNormalisedRatioMeasure | null
  private TransmissionColour_? : IfcColourRgb | IfcNormalisedRatioMeasure | null
  private DiffuseTransmissionColour_? : IfcColourRgb | IfcNormalisedRatioMeasure | null
  private ReflectionColour_? : IfcColourRgb | IfcNormalisedRatioMeasure | null
  private SpecularColour_? : IfcColourRgb | IfcNormalisedRatioMeasure | null
  private SpecularHighlight_? : IfcSpecularExponent | IfcSpecularRoughness | null
  private ReflectanceMethod_? : IfcReflectanceMethodEnum

  public get DiffuseColour() : IfcColourRgb | IfcNormalisedRatioMeasure | null {
    if ( this.DiffuseColour_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
        this.extractReference( 2, 2, 2, true )

      if ( !( value instanceof IfcColourRgb ) && !( value instanceof IfcNormalisedRatioMeasure ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.DiffuseColour_ = value as (IfcColourRgb | IfcNormalisedRatioMeasure)

    }

    return this.DiffuseColour_ as IfcColourRgb | IfcNormalisedRatioMeasure | null
  }

  public get TransmissionColour() : IfcColourRgb | IfcNormalisedRatioMeasure | null {
    if ( this.TransmissionColour_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
        this.extractReference( 3, 2, 2, true )

      if ( !( value instanceof IfcColourRgb ) && !( value instanceof IfcNormalisedRatioMeasure ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.TransmissionColour_ = value as (IfcColourRgb | IfcNormalisedRatioMeasure)

    }

    return this.TransmissionColour_ as IfcColourRgb | IfcNormalisedRatioMeasure | null
  }

  public get DiffuseTransmissionColour() : IfcColourRgb | IfcNormalisedRatioMeasure | null {
    if ( this.DiffuseTransmissionColour_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
        this.extractReference( 4, 2, 2, true )

      if ( !( value instanceof IfcColourRgb ) && !( value instanceof IfcNormalisedRatioMeasure ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.DiffuseTransmissionColour_ = value as (IfcColourRgb | IfcNormalisedRatioMeasure)

    }

    return this.DiffuseTransmissionColour_ as IfcColourRgb | IfcNormalisedRatioMeasure | null
  }

  public get ReflectionColour() : IfcColourRgb | IfcNormalisedRatioMeasure | null {
    if ( this.ReflectionColour_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
        this.extractReference( 5, 2, 2, true )

      if ( !( value instanceof IfcColourRgb ) && !( value instanceof IfcNormalisedRatioMeasure ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.ReflectionColour_ = value as (IfcColourRgb | IfcNormalisedRatioMeasure)

    }

    return this.ReflectionColour_ as IfcColourRgb | IfcNormalisedRatioMeasure | null
  }

  public get SpecularColour() : IfcColourRgb | IfcNormalisedRatioMeasure | null {
    if ( this.SpecularColour_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
        this.extractReference( 6, 2, 2, true )

      if ( !( value instanceof IfcColourRgb ) && !( value instanceof IfcNormalisedRatioMeasure ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.SpecularColour_ = value as (IfcColourRgb | IfcNormalisedRatioMeasure)

    }

    return this.SpecularColour_ as IfcColourRgb | IfcNormalisedRatioMeasure | null
  }

  public get SpecularHighlight() : IfcSpecularExponent | IfcSpecularRoughness | null {
    if ( this.SpecularHighlight_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
        this.extractReference( 7, 2, 2, true )

      if ( !( value instanceof IfcSpecularExponent ) && !( value instanceof IfcSpecularRoughness ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.SpecularHighlight_ = value as (IfcSpecularExponent | IfcSpecularRoughness)

    }

    return this.SpecularHighlight_ as IfcSpecularExponent | IfcSpecularRoughness | null
  }

  public get ReflectanceMethod() : IfcReflectanceMethodEnum {
    if ( this.ReflectanceMethod_ === void 0 ) {
      this.ReflectanceMethod_ = this.extractLambda( 8, 2, 2, IfcReflectanceMethodEnumDeserializeStep, false )
    }

    return this.ReflectanceMethod_ as IfcReflectanceMethodEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSURFACESTYLERENDERING ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSURFACESTYLERENDERING
}
