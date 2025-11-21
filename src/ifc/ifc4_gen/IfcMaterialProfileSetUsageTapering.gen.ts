
import { IfcMaterialProfileSetUsage } from "./index"
import { IfcMaterialProfileSet } from "./index"
import { IfcCardinalPointReference } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcmaterialprofilesetusagetapering.htm */
export  class IfcMaterialProfileSetUsageTapering extends IfcMaterialProfileSetUsage {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCMATERIALPROFILESETUSAGETAPERING
  }
  private ForProfileEndSet_? : IfcMaterialProfileSet
  private CardinalEndPoint_? : number | null

  public get ForProfileEndSet() : IfcMaterialProfileSet {
    if ( this.ForProfileEndSet_ === void 0 ) {
      this.ForProfileEndSet_ = this.extractElement( 3, 3, 2, false, IfcMaterialProfileSet )
    }

    return this.ForProfileEndSet_ as IfcMaterialProfileSet
  }

  public get CardinalEndPoint() : number | null {
    if ( this.CardinalEndPoint_ === void 0 ) {
      this.CardinalEndPoint_ = this.extractNumber( 4, 3, 2, true )
    }

    return this.CardinalEndPoint_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCMATERIALPROFILESETUSAGETAPERING ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCMATERIALPROFILESETUSAGETAPERING
}
