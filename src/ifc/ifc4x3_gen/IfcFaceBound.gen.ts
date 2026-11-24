
import { IfcTopologicalRepresentationItem } from "./index"
import { IfcLoop } from "./index"
import { IfcBoolean } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcFaceBound extends IfcTopologicalRepresentationItem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCFACEBOUND
  }
  private Bound_? : IfcLoop
  private Orientation_? : boolean

  public get Bound() : IfcLoop {
    if ( this.Bound_ === void 0 ) {
      this.Bound_ = this.extractElement( 0, 0, 2, false, IfcLoop )
    }

    return this.Bound_ as IfcLoop
  }

  public get Orientation() : boolean {
    if ( this.Orientation_ === void 0 ) {
      this.Orientation_ = this.extractBoolean( 1, 0, 2, false )
    }

    return this.Orientation_ as boolean
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcFaceBound.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcFaceBound" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCFACEBOUND, EntityTypesIfc4x3.IFCFACEOUTERBOUND ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCFACEBOUND
}
