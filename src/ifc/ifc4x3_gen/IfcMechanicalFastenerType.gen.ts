
import { IfcElementComponentType } from "./index"
import { IfcMechanicalFastenerTypeEnum, IfcMechanicalFastenerTypeEnumDeserializeStep } from "./index"
import { IfcPositiveLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcMechanicalFastenerType extends IfcElementComponentType {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCMECHANICALFASTENERTYPE
  }
  private PredefinedType_? : IfcMechanicalFastenerTypeEnum
  private NominalDiameter_? : number | null
  private NominalLength_? : number | null

  public get PredefinedType() : IfcMechanicalFastenerTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 6, IfcMechanicalFastenerTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcMechanicalFastenerTypeEnum
  }

  public get NominalDiameter() : number | null {
    if ( this.NominalDiameter_ === void 0 ) {
      this.NominalDiameter_ = this.extractNumber( 10, 9, 6, true )
    }

    return this.NominalDiameter_ as number | null
  }

  public get NominalLength() : number | null {
    if ( this.NominalLength_ === void 0 ) {
      this.NominalLength_ = this.extractNumber( 11, 9, 6, true )
    }

    return this.NominalLength_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcMechanicalFastenerType.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcMechanicalFastenerType" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCMECHANICALFASTENERTYPE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCMECHANICALFASTENERTYPE
}
