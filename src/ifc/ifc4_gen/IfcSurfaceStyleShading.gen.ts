
import { IfcPresentationItem } from "./index"
import { IfcColourRgb } from "./index"
import { IfcNormalisedRatioMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcsurfacestyleshading.htm */
export  class IfcSurfaceStyleShading extends IfcPresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSURFACESTYLESHADING
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSURFACESTYLESHADING, EntityTypesIfc.IFCSURFACESTYLERENDERING ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSURFACESTYLESHADING
}
