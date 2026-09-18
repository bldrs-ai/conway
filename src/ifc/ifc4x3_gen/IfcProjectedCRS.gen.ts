
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
export  class IfcProjectedCRS extends IfcCoordinateReferenceSystem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCPROJECTEDCRS
  }
  private VerticalDatum_? : string | null
  private MapProjection_? : string | null
  private MapZone_? : string | null
  private MapUnit_? : IfcNamedUnit | null

  public get VerticalDatum() : string | null {
    if ( this.VerticalDatum_ === void 0 ) {
      this.VerticalDatum_ = this.extractString( 3, 3, 1, true )
    }

    return this.VerticalDatum_ as string | null
  }

  public get MapProjection() : string | null {
    if ( this.MapProjection_ === void 0 ) {
      this.MapProjection_ = this.extractString( 4, 3, 1, true )
    }

    return this.MapProjection_ as string | null
  }

  public get MapZone() : string | null {
    if ( this.MapZone_ === void 0 ) {
      this.MapZone_ = this.extractString( 5, 3, 1, true )
    }

    return this.MapZone_ as string | null
  }

  public get MapUnit() : IfcNamedUnit | null {
    if ( this.MapUnit_ === void 0 ) {
      this.MapUnit_ = this.extractElement( 6, 3, 1, true, IfcNamedUnit )
    }

    return this.MapUnit_ as IfcNamedUnit | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcProjectedCRS.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcProjectedCRS" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCPROJECTEDCRS ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCPROJECTEDCRS
}
