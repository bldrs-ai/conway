
import { IfcSweptDiskSolid } from "./index"
import { IfcPositiveLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcsweptdisksolidpolygonal.htm */
export  class IfcSweptDiskSolidPolygonal extends IfcSweptDiskSolid {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSWEPTDISKSOLIDPOLYGONAL
  }
  private FilletRadius_? : number | null

  public get FilletRadius() : number | null {
    if ( this.FilletRadius_ === void 0 ) {
      this.FilletRadius_ = this.extractNumber( 5, 5, 4, true )
    }

    return this.FilletRadius_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSWEPTDISKSOLIDPOLYGONAL ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSWEPTDISKSOLIDPOLYGONAL
}
