
import { IfcPlacement } from "./index"
import { IfcDirection } from "./index"
import {
  IfcBuildAxes,
} from '../ifc4x3_functions'

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcAxis2Placement3D extends IfcPlacement {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCAXIS2PLACEMENT3D
  }
  private Axis_? : IfcDirection | null
  private RefDirection_? : IfcDirection | null

  public get Axis() : IfcDirection | null {
    if ( this.Axis_ === void 0 ) {
      this.Axis_ = this.extractElement( 1, 1, 3, true, IfcDirection )
    }

    return this.Axis_ as IfcDirection | null
  }

  public get RefDirection() : IfcDirection | null {
    if ( this.RefDirection_ === void 0 ) {
      this.RefDirection_ = this.extractElement( 2, 1, 3, true, IfcDirection )
    }

    return this.RefDirection_ as IfcDirection | null
  }

  public get P() : Array<IfcDirection> {
    return IfcBuildAxes(this?.Axis,this?.RefDirection);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcAxis2Placement3D.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcAxis2Placement3D" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCAXIS2PLACEMENT3D ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCAXIS2PLACEMENT3D
}
