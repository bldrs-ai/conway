
import { IfcCoordinateOperation } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcReal } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcMapConversion extends IfcCoordinateOperation {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCMAPCONVERSION
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcMapConversion.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcMapConversion" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCMAPCONVERSION, EntityTypesIfc4x3.IFCMAPCONVERSIONSCALED ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCMAPCONVERSION
}
