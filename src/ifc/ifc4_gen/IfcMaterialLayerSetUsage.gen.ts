
import { IfcMaterialUsageDefinition } from "./index"
import { IfcMaterialLayerSet } from "./index"
import { IfcLayerSetDirectionEnum, IfcLayerSetDirectionEnumDeserializeStep } from "./index"
import { IfcDirectionSenseEnum, IfcDirectionSenseEnumDeserializeStep } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcPositiveLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcmateriallayersetusage.htm */
export  class IfcMaterialLayerSetUsage extends IfcMaterialUsageDefinition {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCMATERIALLAYERSETUSAGE
  }
  private ForLayerSet_? : IfcMaterialLayerSet
  private LayerSetDirection_? : IfcLayerSetDirectionEnum
  private DirectionSense_? : IfcDirectionSenseEnum
  private OffsetFromReferenceLine_? : number
  private ReferenceExtent_? : number | null

  public get ForLayerSet() : IfcMaterialLayerSet {
    if ( this.ForLayerSet_ === void 0 ) {
      this.ForLayerSet_ = this.extractElement( 0, 0, 1, false, IfcMaterialLayerSet )
    }

    return this.ForLayerSet_ as IfcMaterialLayerSet
  }

  public get LayerSetDirection() : IfcLayerSetDirectionEnum {
    if ( this.LayerSetDirection_ === void 0 ) {
      this.LayerSetDirection_ = this.extractLambda( 1, 0, 1, IfcLayerSetDirectionEnumDeserializeStep, false )
    }

    return this.LayerSetDirection_ as IfcLayerSetDirectionEnum
  }

  public get DirectionSense() : IfcDirectionSenseEnum {
    if ( this.DirectionSense_ === void 0 ) {
      this.DirectionSense_ = this.extractLambda( 2, 0, 1, IfcDirectionSenseEnumDeserializeStep, false )
    }

    return this.DirectionSense_ as IfcDirectionSenseEnum
  }

  public get OffsetFromReferenceLine() : number {
    if ( this.OffsetFromReferenceLine_ === void 0 ) {
      this.OffsetFromReferenceLine_ = this.extractNumber( 3, 0, 1, false )
    }

    return this.OffsetFromReferenceLine_ as number
  }

  public get ReferenceExtent() : number | null {
    if ( this.ReferenceExtent_ === void 0 ) {
      this.ReferenceExtent_ = this.extractNumber( 4, 0, 1, true )
    }

    return this.ReferenceExtent_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCMATERIALLAYERSETUSAGE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCMATERIALLAYERSETUSAGE
}
