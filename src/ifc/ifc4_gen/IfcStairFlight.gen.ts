
import { IfcBuildingElement } from "./index"
import { IfcInteger } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcStairFlightTypeEnum, IfcStairFlightTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstairflight.htm */
export  class IfcStairFlight extends IfcBuildingElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTAIRFLIGHT
  }
  private NumberOfRisers_? : number | null
  private NumberOfTreads_? : number | null
  private RiserHeight_? : number | null
  private TreadLength_? : number | null
  private PredefinedType_? : IfcStairFlightTypeEnum | null

  public get NumberOfRisers() : number | null {
    if ( this.NumberOfRisers_ === void 0 ) {
      this.NumberOfRisers_ = this.extractNumber( 8, 8, 6, true )
    }

    return this.NumberOfRisers_ as number | null
  }

  public get NumberOfTreads() : number | null {
    if ( this.NumberOfTreads_ === void 0 ) {
      this.NumberOfTreads_ = this.extractNumber( 9, 8, 6, true )
    }

    return this.NumberOfTreads_ as number | null
  }

  public get RiserHeight() : number | null {
    if ( this.RiserHeight_ === void 0 ) {
      this.RiserHeight_ = this.extractNumber( 10, 8, 6, true )
    }

    return this.RiserHeight_ as number | null
  }

  public get TreadLength() : number | null {
    if ( this.TreadLength_ === void 0 ) {
      this.TreadLength_ = this.extractNumber( 11, 8, 6, true )
    }

    return this.TreadLength_ as number | null
  }

  public get PredefinedType() : IfcStairFlightTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 12, 8, 6, IfcStairFlightTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcStairFlightTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSTAIRFLIGHT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTAIRFLIGHT
}
