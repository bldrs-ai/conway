
import { IfcGeometricRepresentationItem } from "./index"
import { IfcLabel } from "./index"
import { IfcColourRgb } from "./index"
import { IfcNormalisedRatioMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcLightSource extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCLIGHTSOURCE
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcLightSource.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcLightSource" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCLIGHTSOURCEAMBIENT, EntityTypesIfc4x3.IFCLIGHTSOURCEDIRECTIONAL, EntityTypesIfc4x3.IFCLIGHTSOURCEGONIOMETRIC, EntityTypesIfc4x3.IFCLIGHTSOURCEPOSITIONAL, EntityTypesIfc4x3.IFCLIGHTSOURCESPOT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCLIGHTSOURCE
}
