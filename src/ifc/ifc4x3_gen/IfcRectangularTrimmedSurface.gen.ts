
import { IfcBoundedSurface } from "./index"
import { IfcSurface } from "./index"
import { IfcParameterValue } from "./index"
import { IfcBoolean } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcRectangularTrimmedSurface extends IfcBoundedSurface {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRECTANGULARTRIMMEDSURFACE
  }
  private BasisSurface_? : IfcSurface
  private U1_? : number
  private V1_? : number
  private U2_? : number
  private V2_? : number
  private Usense_? : boolean
  private Vsense_? : boolean

  public get BasisSurface() : IfcSurface {
    if ( this.BasisSurface_ === void 0 ) {
      this.BasisSurface_ = this.extractElement( 0, 0, 4, false, IfcSurface )
    }

    return this.BasisSurface_ as IfcSurface
  }

  public get U1() : number {
    if ( this.U1_ === void 0 ) {
      this.U1_ = this.extractNumber( 1, 0, 4, false )
    }

    return this.U1_ as number
  }

  public get V1() : number {
    if ( this.V1_ === void 0 ) {
      this.V1_ = this.extractNumber( 2, 0, 4, false )
    }

    return this.V1_ as number
  }

  public get U2() : number {
    if ( this.U2_ === void 0 ) {
      this.U2_ = this.extractNumber( 3, 0, 4, false )
    }

    return this.U2_ as number
  }

  public get V2() : number {
    if ( this.V2_ === void 0 ) {
      this.V2_ = this.extractNumber( 4, 0, 4, false )
    }

    return this.V2_ as number
  }

  public get Usense() : boolean {
    if ( this.Usense_ === void 0 ) {
      this.Usense_ = this.extractBoolean( 5, 0, 4, false )
    }

    return this.Usense_ as boolean
  }

  public get Vsense() : boolean {
    if ( this.Vsense_ === void 0 ) {
      this.Vsense_ = this.extractBoolean( 6, 0, 4, false )
    }

    return this.Vsense_ as boolean
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRectangularTrimmedSurface.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRectangularTrimmedSurface" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRECTANGULARTRIMMEDSURFACE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRECTANGULARTRIMMEDSURFACE
}
