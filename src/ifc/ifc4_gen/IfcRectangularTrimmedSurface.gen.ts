
import { IfcBoundedSurface } from "./index"
import { IfcSurface } from "./index"
import { IfcParameterValue } from "./index"
import { IfcBoolean } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrectangulartrimmedsurface.htm */
export  class IfcRectangularTrimmedSurface extends IfcBoundedSurface {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRECTANGULARTRIMMEDSURFACE
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRECTANGULARTRIMMEDSURFACE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRECTANGULARTRIMMEDSURFACE
}
