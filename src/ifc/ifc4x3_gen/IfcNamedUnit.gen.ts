
import { IfcDimensionalExponents } from "./index"
import { IfcUnitEnum, IfcUnitEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcNamedUnit extends StepEntityBase< EntityTypesIfc4x3 > {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCNAMEDUNIT
  }
  private Dimensions_? : IfcDimensionalExponents
  private UnitType_? : IfcUnitEnum

  public get Dimensions() : IfcDimensionalExponents {
    if ( this.Dimensions_ === void 0 ) {
      this.Dimensions_ = this.extractElement( 0, 0, 0, false, IfcDimensionalExponents )
    }

    return this.Dimensions_ as IfcDimensionalExponents
  }

  public get UnitType() : IfcUnitEnum {
    if ( this.UnitType_ === void 0 ) {
      this.UnitType_ = this.extractLambda( 1, 0, 0, IfcUnitEnumDeserializeStep, false )
    }

    return this.UnitType_ as IfcUnitEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcNamedUnit.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcNamedUnit" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCONTEXTDEPENDENTUNIT, EntityTypesIfc4x3.IFCCONVERSIONBASEDUNIT, EntityTypesIfc4x3.IFCSIUNIT, EntityTypesIfc4x3.IFCCONVERSIONBASEDUNITWITHOFFSET ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCNAMEDUNIT
}
