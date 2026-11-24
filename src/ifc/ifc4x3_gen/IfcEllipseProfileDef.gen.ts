
import { IfcParameterizedProfileDef } from "./index"
import { IfcPositiveLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcEllipseProfileDef extends IfcParameterizedProfileDef {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCELLIPSEPROFILEDEF
  }
  private SemiAxis1_? : number
  private SemiAxis2_? : number

  public get SemiAxis1() : number {
    if ( this.SemiAxis1_ === void 0 ) {
      this.SemiAxis1_ = this.extractNumber( 3, 3, 2, false )
    }

    return this.SemiAxis1_ as number
  }

  public get SemiAxis2() : number {
    if ( this.SemiAxis2_ === void 0 ) {
      this.SemiAxis2_ = this.extractNumber( 4, 3, 2, false )
    }

    return this.SemiAxis2_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcEllipseProfileDef.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcEllipseProfileDef" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCELLIPSEPROFILEDEF ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCELLIPSEPROFILEDEF
}
