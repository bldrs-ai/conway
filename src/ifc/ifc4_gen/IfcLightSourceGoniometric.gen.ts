
import { IfcLightSource } from "./index"
import { IfcAxis2Placement3D } from "./index"
import { IfcColourRgb } from "./index"
import { IfcThermodynamicTemperatureMeasure } from "./index"
import { IfcLuminousFluxMeasure } from "./index"
import { IfcLightEmissionSourceEnum, IfcLightEmissionSourceEnumDeserializeStep } from "./index"
import { IfcExternalReference } from "./index"
import { IfcLightIntensityDistribution } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifclightsourcegoniometric.htm */
export  class IfcLightSourceGoniometric extends IfcLightSource {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCLIGHTSOURCEGONIOMETRIC
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
      
      const value : StepEntityBase< EntityTypesIfc > = 
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCLIGHTSOURCEGONIOMETRIC ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCLIGHTSOURCEGONIOMETRIC
}
