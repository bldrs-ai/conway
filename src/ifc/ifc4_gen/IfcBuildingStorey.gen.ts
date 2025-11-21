
import { IfcSpatialStructureElement } from "./index"
import { IfcLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcbuildingstorey.htm */
export  class IfcBuildingStorey extends IfcSpatialStructureElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCBUILDINGSTOREY
  }
  private Elevation_? : number | null

  public get Elevation() : number | null {
    if ( this.Elevation_ === void 0 ) {
      this.Elevation_ = this.extractNumber( 9, 9, 6, true )
    }

    return this.Elevation_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCBUILDINGSTOREY ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCBUILDINGSTOREY
}
