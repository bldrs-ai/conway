
import { IfcPresentationItem } from "./index"
import { IfcColourRgb } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcSurfaceStyleLighting extends IfcPresentationItem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSURFACESTYLELIGHTING
  }
  private DiffuseTransmissionColour_? : IfcColourRgb
  private DiffuseReflectionColour_? : IfcColourRgb
  private TransmissionColour_? : IfcColourRgb
  private ReflectanceColour_? : IfcColourRgb

  public get DiffuseTransmissionColour() : IfcColourRgb {
    if ( this.DiffuseTransmissionColour_ === void 0 ) {
      this.DiffuseTransmissionColour_ = this.extractElement( 0, 0, 1, false, IfcColourRgb )
    }

    return this.DiffuseTransmissionColour_ as IfcColourRgb
  }

  public get DiffuseReflectionColour() : IfcColourRgb {
    if ( this.DiffuseReflectionColour_ === void 0 ) {
      this.DiffuseReflectionColour_ = this.extractElement( 1, 0, 1, false, IfcColourRgb )
    }

    return this.DiffuseReflectionColour_ as IfcColourRgb
  }

  public get TransmissionColour() : IfcColourRgb {
    if ( this.TransmissionColour_ === void 0 ) {
      this.TransmissionColour_ = this.extractElement( 2, 0, 1, false, IfcColourRgb )
    }

    return this.TransmissionColour_ as IfcColourRgb
  }

  public get ReflectanceColour() : IfcColourRgb {
    if ( this.ReflectanceColour_ === void 0 ) {
      this.ReflectanceColour_ = this.extractElement( 3, 0, 1, false, IfcColourRgb )
    }

    return this.ReflectanceColour_ as IfcColourRgb
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcSurfaceStyleLighting.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcSurfaceStyleLighting" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSURFACESTYLELIGHTING ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSURFACESTYLELIGHTING
}
