
import { IfcMaterialUsageDefinition } from "./index"
import { IfcMaterialProfileSet } from "./index"
import { IfcCardinalPointReference } from "./index"
import { IfcPositiveLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcMaterialProfileSetUsage extends IfcMaterialUsageDefinition {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCMATERIALPROFILESETUSAGE
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcMaterialProfileSetUsage.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcMaterialProfileSetUsage" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCMATERIALPROFILESETUSAGE, EntityTypesIfc4x3.IFCMATERIALPROFILESETUSAGETAPERING ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCMATERIALPROFILESETUSAGE
}
