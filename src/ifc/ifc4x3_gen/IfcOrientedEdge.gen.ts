
import { IfcEdge } from "./index"
import { IfcBoolean } from "./index"
import { IfcVertex } from "./index"
import {
  IfcBooleanChoose,
} from '../ifc4x3_functions'

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcOrientedEdge extends IfcEdge {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCORIENTEDEDGE
  }
  private EdgeElement_? : IfcEdge
  private Orientation_? : boolean

  public get EdgeElement() : IfcEdge {
    if ( this.EdgeElement_ === void 0 ) {
      this.EdgeElement_ = this.extractElement( 2, 2, 3, false, IfcEdge )
    }

    return this.EdgeElement_ as IfcEdge
  }

  public get Orientation() : boolean {
    if ( this.Orientation_ === void 0 ) {
      this.Orientation_ = this.extractBoolean( 3, 2, 3, false )
    }

    return this.Orientation_ as boolean
  }

  public get EdgeStart() : IfcVertex {
    return IfcBooleanChoose(this?.Orientation,this?.EdgeElement?.EdgeStart,this?.EdgeElement?.EdgeEnd);
  }

  public get EdgeEnd() : IfcVertex {
    return IfcBooleanChoose(this?.Orientation,this?.EdgeElement?.EdgeEnd,this?.EdgeElement?.EdgeStart);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcOrientedEdge.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcOrientedEdge" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCORIENTEDEDGE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCORIENTEDEDGE
}
