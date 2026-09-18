
import { IfcEdge } from "./index"
import { IfcCurve } from "./index"
import { IfcBoolean } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcEdgeCurve extends IfcEdge {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCEDGECURVE
  }
  private EdgeGeometry_? : IfcCurve
  private SameSense_? : boolean

  public get EdgeGeometry() : IfcCurve {
    if ( this.EdgeGeometry_ === void 0 ) {
      this.EdgeGeometry_ = this.extractElement( 2, 2, 3, false, IfcCurve )
    }

    return this.EdgeGeometry_ as IfcCurve
  }

  public get SameSense() : boolean {
    if ( this.SameSense_ === void 0 ) {
      this.SameSense_ = this.extractBoolean( 3, 2, 3, false )
    }

    return this.SameSense_ as boolean
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcEdgeCurve.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcEdgeCurve" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCEDGECURVE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCEDGECURVE
}
