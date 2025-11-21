
import { IfcMaterialUsageDefinition } from "./index"
import { IfcMaterialProfileSet } from "./index"
import { IfcCardinalPointReference } from "./index"
import { IfcPositiveLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcmaterialprofilesetusage.htm */
export  class IfcMaterialProfileSetUsage extends IfcMaterialUsageDefinition {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCMATERIALPROFILESETUSAGE
  }
  private ForProfileSet_? : IfcMaterialProfileSet
  private CardinalPoint_? : number | null
  private ReferenceExtent_? : number | null

  public get ForProfileSet() : IfcMaterialProfileSet {
    if ( this.ForProfileSet_ === void 0 ) {
      this.ForProfileSet_ = this.extractElement( 0, 0, 1, false, IfcMaterialProfileSet )
    }

    return this.ForProfileSet_ as IfcMaterialProfileSet
  }

  public get CardinalPoint() : number | null {
    if ( this.CardinalPoint_ === void 0 ) {
      this.CardinalPoint_ = this.extractNumber( 1, 0, 1, true )
    }

    return this.CardinalPoint_ as number | null
  }

  public get ReferenceExtent() : number | null {
    if ( this.ReferenceExtent_ === void 0 ) {
      this.ReferenceExtent_ = this.extractNumber( 2, 0, 1, true )
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
    [ EntityTypesIfc.IFCMATERIALPROFILESETUSAGE, EntityTypesIfc.IFCMATERIALPROFILESETUSAGETAPERING ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCMATERIALPROFILESETUSAGE
}
