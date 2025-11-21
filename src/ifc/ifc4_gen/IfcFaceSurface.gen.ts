
import { IfcFace } from "./index"
import { IfcSurface } from "./index"
import { IfcBoolean } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcfacesurface.htm */
export  class IfcFaceSurface extends IfcFace {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCFACESURFACE
  }
  private FaceSurface_? : IfcSurface
  private SameSense_? : boolean

  public get FaceSurface() : IfcSurface {
    if ( this.FaceSurface_ === void 0 ) {
      this.FaceSurface_ = this.extractElement( 1, 1, 3, false, IfcSurface )
    }

    return this.FaceSurface_ as IfcSurface
  }

  public get SameSense() : boolean {
    if ( this.SameSense_ === void 0 ) {
      this.SameSense_ = this.extractBoolean( 2, 1, 3, false )
    }

    return this.SameSense_ as boolean
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCFACESURFACE, EntityTypesIfc.IFCADVANCEDFACE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCFACESURFACE
}
