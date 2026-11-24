
import { IfcCoordinateReferenceSystem } from "./index"
import { IfcIdentifier } from "./index"
import { IfcNamedUnit } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcGeographicCRS extends IfcCoordinateReferenceSystem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCGEOGRAPHICCRS
  }
  private PrimeMeridian_? : string | null
  private AngleUnit_? : IfcNamedUnit | null
  private HeightUnit_? : IfcNamedUnit | null

  public get PrimeMeridian() : string | null {
    if ( this.PrimeMeridian_ === void 0 ) {
      this.PrimeMeridian_ = this.extractString( 3, 3, 1, true )
    }

    return this.PrimeMeridian_ as string | null
  }

  public get AngleUnit() : IfcNamedUnit | null {
    if ( this.AngleUnit_ === void 0 ) {
      this.AngleUnit_ = this.extractElement( 4, 3, 1, true, IfcNamedUnit )
    }

    return this.AngleUnit_ as IfcNamedUnit | null
  }

  public get HeightUnit() : IfcNamedUnit | null {
    if ( this.HeightUnit_ === void 0 ) {
      this.HeightUnit_ = this.extractElement( 5, 3, 1, true, IfcNamedUnit )
    }

    return this.HeightUnit_ as IfcNamedUnit | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcGeographicCRS.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcGeographicCRS" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCGEOGRAPHICCRS ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCGEOGRAPHICCRS
}
