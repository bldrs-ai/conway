
import { IfcBuildingElement } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcWindowTypeEnum, IfcWindowTypeEnumDeserializeStep } from "./index"
import { IfcWindowTypePartitioningEnum, IfcWindowTypePartitioningEnumDeserializeStep } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcwindow.htm */
export  class IfcWindow extends IfcBuildingElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCWINDOW
  }
  private OverallHeight_? : number | null
  private OverallWidth_? : number | null
  private PredefinedType_? : IfcWindowTypeEnum | null
  private PartitioningType_? : IfcWindowTypePartitioningEnum | null
  private UserDefinedPartitioningType_? : string | null

  public get OverallHeight() : number | null {
    if ( this.OverallHeight_ === void 0 ) {
      this.OverallHeight_ = this.extractNumber( 8, 8, 6, true )
    }

    return this.OverallHeight_ as number | null
  }

  public get OverallWidth() : number | null {
    if ( this.OverallWidth_ === void 0 ) {
      this.OverallWidth_ = this.extractNumber( 9, 8, 6, true )
    }

    return this.OverallWidth_ as number | null
  }

  public get PredefinedType() : IfcWindowTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 10, 8, 6, IfcWindowTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcWindowTypeEnum | null
  }

  public get PartitioningType() : IfcWindowTypePartitioningEnum | null {
    if ( this.PartitioningType_ === void 0 ) {
      this.PartitioningType_ = this.extractLambda( 11, 8, 6, IfcWindowTypePartitioningEnumDeserializeStep, true )
    }

    return this.PartitioningType_ as IfcWindowTypePartitioningEnum | null
  }

  public get UserDefinedPartitioningType() : string | null {
    if ( this.UserDefinedPartitioningType_ === void 0 ) {
      this.UserDefinedPartitioningType_ = this.extractString( 12, 8, 6, true )
    }

    return this.UserDefinedPartitioningType_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCWINDOW, EntityTypesIfc.IFCWINDOWSTANDARDCASE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCWINDOW
}
