
import { IfcGeometricRepresentationItem } from "./index"
import { IfcLabel } from "./index"
import { IfcColourRgb } from "./index"
import { IfcNormalisedRatioMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifclightsource.htm */
export abstract class IfcLightSource extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCLIGHTSOURCE
  }
  private Name_? : string | null
  private LightColour_? : IfcColourRgb
  private AmbientIntensity_? : number | null
  private Intensity_? : number | null

  public get Name() : string | null {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 0, 0, 2, true )
    }

    return this.Name_ as string | null
  }

  public get LightColour() : IfcColourRgb {
    if ( this.LightColour_ === void 0 ) {
      this.LightColour_ = this.extractElement( 1, 0, 2, false, IfcColourRgb )
    }

    return this.LightColour_ as IfcColourRgb
  }

  public get AmbientIntensity() : number | null {
    if ( this.AmbientIntensity_ === void 0 ) {
      this.AmbientIntensity_ = this.extractNumber( 2, 0, 2, true )
    }

    return this.AmbientIntensity_ as number | null
  }

  public get Intensity() : number | null {
    if ( this.Intensity_ === void 0 ) {
      this.Intensity_ = this.extractNumber( 3, 0, 2, true )
    }

    return this.Intensity_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCLIGHTSOURCEAMBIENT, EntityTypesIfc.IFCLIGHTSOURCEDIRECTIONAL, EntityTypesIfc.IFCLIGHTSOURCEGONIOMETRIC, EntityTypesIfc.IFCLIGHTSOURCEPOSITIONAL, EntityTypesIfc.IFCLIGHTSOURCESPOT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCLIGHTSOURCE
}
