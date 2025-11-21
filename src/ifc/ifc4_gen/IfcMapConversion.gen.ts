
import { IfcCoordinateOperation } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcReal } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcmapconversion.htm */
export  class IfcMapConversion extends IfcCoordinateOperation {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCMAPCONVERSION
  }
  private Eastings_? : number
  private Northings_? : number
  private OrthogonalHeight_? : number
  private XAxisAbscissa_? : number | null
  private XAxisOrdinate_? : number | null
  private Scale_? : number | null

  public get Eastings() : number {
    if ( this.Eastings_ === void 0 ) {
      this.Eastings_ = this.extractNumber( 2, 2, 1, false )
    }

    return this.Eastings_ as number
  }

  public get Northings() : number {
    if ( this.Northings_ === void 0 ) {
      this.Northings_ = this.extractNumber( 3, 2, 1, false )
    }

    return this.Northings_ as number
  }

  public get OrthogonalHeight() : number {
    if ( this.OrthogonalHeight_ === void 0 ) {
      this.OrthogonalHeight_ = this.extractNumber( 4, 2, 1, false )
    }

    return this.OrthogonalHeight_ as number
  }

  public get XAxisAbscissa() : number | null {
    if ( this.XAxisAbscissa_ === void 0 ) {
      this.XAxisAbscissa_ = this.extractNumber( 5, 2, 1, true )
    }

    return this.XAxisAbscissa_ as number | null
  }

  public get XAxisOrdinate() : number | null {
    if ( this.XAxisOrdinate_ === void 0 ) {
      this.XAxisOrdinate_ = this.extractNumber( 6, 2, 1, true )
    }

    return this.XAxisOrdinate_ as number | null
  }

  public get Scale() : number | null {
    if ( this.Scale_ === void 0 ) {
      this.Scale_ = this.extractNumber( 7, 2, 1, true )
    }

    return this.Scale_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCMAPCONVERSION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCMAPCONVERSION
}
