
import { IfcMaterialProfileSetUsage } from "./index"
import { IfcMaterialProfileSet } from "./index"
import { IfcCardinalPointReference } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcMaterialProfileSetUsageTapering extends IfcMaterialProfileSetUsage {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCMATERIALPROFILESETUSAGETAPERING
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcMaterialProfileSetUsageTapering.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcMaterialProfileSetUsageTapering" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCMATERIALPROFILESETUSAGETAPERING ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCMATERIALPROFILESETUSAGETAPERING
}
