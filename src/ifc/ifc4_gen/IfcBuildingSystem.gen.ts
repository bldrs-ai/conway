
import { IfcSystem } from "./index"
import { IfcBuildingSystemTypeEnum, IfcBuildingSystemTypeEnumDeserializeStep } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcbuildingsystem.htm */
export  class IfcBuildingSystem extends IfcSystem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCBUILDINGSYSTEM
  }
  private PredefinedType_? : IfcBuildingSystemTypeEnum | null
  private LongName_? : string | null

  public get PredefinedType() : IfcBuildingSystemTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 5, 5, 5, IfcBuildingSystemTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcBuildingSystemTypeEnum | null
  }

  public get LongName() : string | null {
    if ( this.LongName_ === void 0 ) {
      this.LongName_ = this.extractString( 6, 5, 5, true )
    }

    return this.LongName_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCBUILDINGSYSTEM ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCBUILDINGSYSTEM
}
