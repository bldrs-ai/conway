
import { IfcPresentationItem } from "./index"
import { IfcReal } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcsurfacestylerefraction.htm */
export  class IfcSurfaceStyleRefraction extends IfcPresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSURFACESTYLEREFRACTION
  }
  private RefractionIndex_? : number | null
  private DispersionFactor_? : number | null

  public get RefractionIndex() : number | null {
    if ( this.RefractionIndex_ === void 0 ) {
      this.RefractionIndex_ = this.extractNumber( 0, 0, 1, true )
    }

    return this.RefractionIndex_ as number | null
  }

  public get DispersionFactor() : number | null {
    if ( this.DispersionFactor_ === void 0 ) {
      this.DispersionFactor_ = this.extractNumber( 1, 0, 1, true )
    }

    return this.DispersionFactor_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSURFACESTYLEREFRACTION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSURFACESTYLEREFRACTION
}
