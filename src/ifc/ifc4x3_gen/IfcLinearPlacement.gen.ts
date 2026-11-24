
import { IfcObjectPlacement } from "./index"
import { IfcAxis2PlacementLinear } from "./index"
import { IfcAxis2Placement3D } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcLinearPlacement extends IfcObjectPlacement {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCLINEARPLACEMENT
  }
  private RelativePlacement_? : IfcAxis2PlacementLinear
  private CartesianPosition_? : IfcAxis2Placement3D | null

  public get RelativePlacement() : IfcAxis2PlacementLinear {
    if ( this.RelativePlacement_ === void 0 ) {
      this.RelativePlacement_ = this.extractElement( 1, 1, 1, false, IfcAxis2PlacementLinear )
    }

    return this.RelativePlacement_ as IfcAxis2PlacementLinear
  }

  public get CartesianPosition() : IfcAxis2Placement3D | null {
    if ( this.CartesianPosition_ === void 0 ) {
      this.CartesianPosition_ = this.extractElement( 2, 1, 1, true, IfcAxis2Placement3D )
    }

    return this.CartesianPosition_ as IfcAxis2Placement3D | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcLinearPlacement.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcLinearPlacement" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCLINEARPLACEMENT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCLINEARPLACEMENT
}
