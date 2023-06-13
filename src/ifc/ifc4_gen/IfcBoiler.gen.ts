
import { IfcEnergyConversionDevice } from "./index"
import { IfcBoilerTypeEnum, IfcBoilerTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcboiler.htm */
export  class IfcBoiler extends IfcEnergyConversionDevice {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCBOILER
  }
  private PredefinedType_? : IfcBoilerTypeEnum | null

  public get PredefinedType() : IfcBoilerTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, IfcBoilerTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcBoilerTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCBOILER ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCBOILER
}
