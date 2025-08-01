
import { IfcSystem } from "./index"
import { IfcLabel } from "./index"
import { IfcDistributionSystemEnum, IfcDistributionSystemEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcdistributionsystem.htm */
export  class IfcDistributionSystem extends IfcSystem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCDISTRIBUTIONSYSTEM
  }
  private LongName_? : string | null
  private PredefinedType_? : IfcDistributionSystemEnum | null

  public get LongName() : string | null {
    if ( this.LongName_ === void 0 ) {
      this.LongName_ = this.extractString( 5, 5, 5, true )
    }

    return this.LongName_ as string | null
  }

  public get PredefinedType() : IfcDistributionSystemEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 6, 5, 5, IfcDistributionSystemEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcDistributionSystemEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCDISTRIBUTIONSYSTEM, EntityTypesIfc.IFCDISTRIBUTIONCIRCUIT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCDISTRIBUTIONSYSTEM
}
