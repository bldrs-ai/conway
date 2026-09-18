
import { IfcWellKnownTextLiteral } from "./index"
import { IfcCoordinateReferenceSystem } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcWellKnownText extends StepEntityBase< EntityTypesIfc4x3 > {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCWELLKNOWNTEXT
  }
  private WellKnownText_? : string
  private CoordinateReferenceSystem_? : IfcCoordinateReferenceSystem

  public get WellKnownText() : string {
    if ( this.WellKnownText_ === void 0 ) {
      this.WellKnownText_ = this.extractString( 0, 0, 0, false )
    }

    return this.WellKnownText_ as string
  }

  public get CoordinateReferenceSystem() : IfcCoordinateReferenceSystem {
    if ( this.CoordinateReferenceSystem_ === void 0 ) {
      this.CoordinateReferenceSystem_ = this.extractElement( 1, 0, 0, false, IfcCoordinateReferenceSystem )
    }

    return this.CoordinateReferenceSystem_ as IfcCoordinateReferenceSystem
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcWellKnownText.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcWellKnownText" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCWELLKNOWNTEXT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCWELLKNOWNTEXT
}
