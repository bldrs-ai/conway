
import { IfcStructuralLoadStatic } from "./index"
import { IfcThermodynamicTemperatureMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstructuralloadtemperature.htm */
export  class IfcStructuralLoadTemperature extends IfcStructuralLoadStatic {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTRUCTURALLOADTEMPERATURE
  }
  private DeltaTConstant_? : number | null
  private DeltaTY_? : number | null
  private DeltaTZ_? : number | null

  public get DeltaTConstant() : number | null {
    if ( this.DeltaTConstant_ === void 0 ) {
      this.DeltaTConstant_ = this.extractNumber( 1, 1, 3, true )
    }

    return this.DeltaTConstant_ as number | null
  }

  public get DeltaTY() : number | null {
    if ( this.DeltaTY_ === void 0 ) {
      this.DeltaTY_ = this.extractNumber( 2, 1, 3, true )
    }

    return this.DeltaTY_ as number | null
  }

  public get DeltaTZ() : number | null {
    if ( this.DeltaTZ_ === void 0 ) {
      this.DeltaTZ_ = this.extractNumber( 3, 1, 3, true )
    }

    return this.DeltaTZ_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSTRUCTURALLOADTEMPERATURE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTRUCTURALLOADTEMPERATURE
}
