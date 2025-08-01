
import { IfcDimensionalExponents } from "./index"
import { IfcUnitEnum, IfcUnitEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcnamedunit.htm */
export abstract class IfcNamedUnit extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCNAMEDUNIT
  }
  private Dimensions_? : IfcDimensionalExponents
  private UnitType_? : IfcUnitEnum

  public get Dimensions() : IfcDimensionalExponents {
    if ( this.Dimensions_ === void 0 ) {
      this.Dimensions_ = this.extractElement( 0, 0, 0, false, IfcDimensionalExponents )
    }

    return this.Dimensions_ as IfcDimensionalExponents
  }

  public get UnitType() : IfcUnitEnum {
    if ( this.UnitType_ === void 0 ) {
      this.UnitType_ = this.extractLambda( 1, 0, 0, IfcUnitEnumDeserializeStep, false )
    }

    return this.UnitType_ as IfcUnitEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCONTEXTDEPENDENTUNIT, EntityTypesIfc.IFCCONVERSIONBASEDUNIT, EntityTypesIfc.IFCSIUNIT, EntityTypesIfc.IFCCONVERSIONBASEDUNITWITHOFFSET ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCNAMEDUNIT
}
