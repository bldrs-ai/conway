
import { IfcNamedUnit } from "./index"
import { IfcLabel } from "./index"
import { IfcMeasureWithUnit } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcConversionBasedUnit extends IfcNamedUnit {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCCONVERSIONBASEDUNIT
  }
  private Name_? : string
  private ConversionFactor_? : IfcMeasureWithUnit

  public get Name() : string {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 2, 2, 1, false )
    }

    return this.Name_ as string
  }

  public get ConversionFactor() : IfcMeasureWithUnit {
    if ( this.ConversionFactor_ === void 0 ) {
      this.ConversionFactor_ = this.extractElement( 3, 2, 1, false, IfcMeasureWithUnit )
    }

    return this.ConversionFactor_ as IfcMeasureWithUnit
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcConversionBasedUnit.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcConversionBasedUnit" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCONVERSIONBASEDUNIT, EntityTypesIfc4x3.IFCCONVERSIONBASEDUNITWITHOFFSET ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCCONVERSIONBASEDUNIT
}
