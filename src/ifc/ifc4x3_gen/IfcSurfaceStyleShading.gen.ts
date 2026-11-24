
import { IfcPresentationItem } from "./index"
import { IfcColourRgb } from "./index"
import { IfcNormalisedRatioMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcSurfaceStyleShading extends IfcPresentationItem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSURFACESTYLESHADING
  }
  private SurfaceColour_? : IfcColourRgb
  private Transparency_? : number | null

  public get SurfaceColour() : IfcColourRgb {
    if ( this.SurfaceColour_ === void 0 ) {
      this.SurfaceColour_ = this.extractElement( 0, 0, 1, false, IfcColourRgb )
    }

    return this.SurfaceColour_ as IfcColourRgb
  }

  public get Transparency() : number | null {
    if ( this.Transparency_ === void 0 ) {
      this.Transparency_ = this.extractNumber( 1, 0, 1, true )
    }

    return this.Transparency_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcSurfaceStyleShading.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcSurfaceStyleShading" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSURFACESTYLESHADING, EntityTypesIfc4x3.IFCSURFACESTYLERENDERING ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSURFACESTYLESHADING
}
