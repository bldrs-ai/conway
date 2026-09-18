
import { IfcSystem } from "./index"
import { IfcLabel } from "./index"
import { IfcDistributionSystemEnum, IfcDistributionSystemEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcDistributionSystem extends IfcSystem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCDISTRIBUTIONSYSTEM
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcDistributionSystem.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcDistributionSystem" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCDISTRIBUTIONSYSTEM, EntityTypesIfc4x3.IFCDISTRIBUTIONCIRCUIT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCDISTRIBUTIONSYSTEM
}
