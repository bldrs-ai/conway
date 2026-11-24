
import { IfcSpiral } from "./index"
import { IfcLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcSeventhOrderPolynomialSpiral extends IfcSpiral {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSEVENTHORDERPOLYNOMIALSPIRAL
  }
  private SepticTerm_? : number
  private SexticTerm_? : number | null
  private QuinticTerm_? : number | null
  private QuarticTerm_? : number | null
  private CubicTerm_? : number | null
  private QuadraticTerm_? : number | null
  private LinearTerm_? : number | null
  private ConstantTerm_? : number | null

  public get SepticTerm() : number {
    if ( this.SepticTerm_ === void 0 ) {
      this.SepticTerm_ = this.extractNumber( 1, 1, 4, false )
    }

    return this.SepticTerm_ as number
  }

  public get SexticTerm() : number | null {
    if ( this.SexticTerm_ === void 0 ) {
      this.SexticTerm_ = this.extractNumber( 2, 1, 4, true )
    }

    return this.SexticTerm_ as number | null
  }

  public get QuinticTerm() : number | null {
    if ( this.QuinticTerm_ === void 0 ) {
      this.QuinticTerm_ = this.extractNumber( 3, 1, 4, true )
    }

    return this.QuinticTerm_ as number | null
  }

  public get QuarticTerm() : number | null {
    if ( this.QuarticTerm_ === void 0 ) {
      this.QuarticTerm_ = this.extractNumber( 4, 1, 4, true )
    }

    return this.QuarticTerm_ as number | null
  }

  public get CubicTerm() : number | null {
    if ( this.CubicTerm_ === void 0 ) {
      this.CubicTerm_ = this.extractNumber( 5, 1, 4, true )
    }

    return this.CubicTerm_ as number | null
  }

  public get QuadraticTerm() : number | null {
    if ( this.QuadraticTerm_ === void 0 ) {
      this.QuadraticTerm_ = this.extractNumber( 6, 1, 4, true )
    }

    return this.QuadraticTerm_ as number | null
  }

  public get LinearTerm() : number | null {
    if ( this.LinearTerm_ === void 0 ) {
      this.LinearTerm_ = this.extractNumber( 7, 1, 4, true )
    }

    return this.LinearTerm_ as number | null
  }

  public get ConstantTerm() : number | null {
    if ( this.ConstantTerm_ === void 0 ) {
      this.ConstantTerm_ = this.extractNumber( 8, 1, 4, true )
    }

    return this.ConstantTerm_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcSeventhOrderPolynomialSpiral.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcSeventhOrderPolynomialSpiral" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSEVENTHORDERPOLYNOMIALSPIRAL ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSEVENTHORDERPOLYNOMIALSPIRAL
}
