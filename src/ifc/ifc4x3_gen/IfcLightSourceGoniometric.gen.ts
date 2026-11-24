
import { IfcLightSource } from "./index"
import { IfcAxis2Placement3D } from "./index"
import { IfcColourRgb } from "./index"
import { IfcThermodynamicTemperatureMeasure } from "./index"
import { IfcLuminousFluxMeasure } from "./index"
import { IfcLightEmissionSourceEnum, IfcLightEmissionSourceEnumDeserializeStep } from "./index"
import { IfcExternalReference } from "./index"
import { IfcLightIntensityDistribution } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcLightSourceGoniometric extends IfcLightSource {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCLIGHTSOURCEGONIOMETRIC
  }
  private Position_? : IfcAxis2Placement3D
  private ColourAppearance_? : IfcColourRgb | null
  private ColourTemperature_? : number
  private LuminousFlux_? : number
  private LightEmissionSource_? : IfcLightEmissionSourceEnum
  private LightDistributionDataSource_? : IfcExternalReference | IfcLightIntensityDistribution

  public get Position() : IfcAxis2Placement3D {
    if ( this.Position_ === void 0 ) {
      this.Position_ = this.extractElement( 4, 4, 3, false, IfcAxis2Placement3D )
    }

    return this.Position_ as IfcAxis2Placement3D
  }

  public get ColourAppearance() : IfcColourRgb | null {
    if ( this.ColourAppearance_ === void 0 ) {
      this.ColourAppearance_ = this.extractElement( 5, 4, 3, true, IfcColourRgb )
    }

    return this.ColourAppearance_ as IfcColourRgb | null
  }

  public get ColourTemperature() : number {
    if ( this.ColourTemperature_ === void 0 ) {
      this.ColourTemperature_ = this.extractNumber( 6, 4, 3, false )
    }

    return this.ColourTemperature_ as number
  }

  public get LuminousFlux() : number {
    if ( this.LuminousFlux_ === void 0 ) {
      this.LuminousFlux_ = this.extractNumber( 7, 4, 3, false )
    }

    return this.LuminousFlux_ as number
  }

  public get LightEmissionSource() : IfcLightEmissionSourceEnum {
    if ( this.LightEmissionSource_ === void 0 ) {
      this.LightEmissionSource_ = this.extractLambda( 8, 4, 3, IfcLightEmissionSourceEnumDeserializeStep, false )
    }

    return this.LightEmissionSource_ as IfcLightEmissionSourceEnum
  }

  public get LightDistributionDataSource() : IfcExternalReference | IfcLightIntensityDistribution {
    if ( this.LightDistributionDataSource_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
        this.extractReference( 9, 4, 3, false )

      if ( !( value instanceof IfcExternalReference ) && !( value instanceof IfcLightIntensityDistribution ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.LightDistributionDataSource_ = value as (IfcExternalReference | IfcLightIntensityDistribution)

    }

    return this.LightDistributionDataSource_ as IfcExternalReference | IfcLightIntensityDistribution
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcLightSourceGoniometric.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcLightSourceGoniometric" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCLIGHTSOURCEGONIOMETRIC ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCLIGHTSOURCEGONIOMETRIC
}
