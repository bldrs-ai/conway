
import { IfcNamedUnit } from "./index"
import { IfcSIPrefix, IfcSIPrefixDeserializeStep } from "./index"
import { IfcSIUnitName, IfcSIUnitNameDeserializeStep } from "./index"
import { IfcDimensionalExponents } from "./index"
import {
  IfcDimensionsForSiUnit,
} from '../ifc_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcsiunit.htm */
export  class IfcSIUnit extends IfcNamedUnit {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSIUNIT
  }
  private Prefix_? : IfcSIPrefix | null
  private Name_? : IfcSIUnitName

  public get Prefix() : IfcSIPrefix | null {
    if ( this.Prefix_ === void 0 ) {
      this.Prefix_ = this.extractLambda( 2, 2, 1, IfcSIPrefixDeserializeStep, true )
    }

    return this.Prefix_ as IfcSIPrefix | null
  }

  public get Name() : IfcSIUnitName {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractLambda( 3, 2, 1, IfcSIUnitNameDeserializeStep, false )
    }

    return this.Name_ as IfcSIUnitName
  }

  public get Dimensions() : IfcDimensionalExponents {
    return IfcDimensionsForSiUnit(this?.Name);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSIUNIT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSIUNIT
}
