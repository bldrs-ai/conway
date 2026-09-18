
import { IfcObjectPlacement } from "./index"
import { IfcVirtualGridIntersection } from "./index"
import { IfcDirection } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcGridPlacement extends IfcObjectPlacement {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCGRIDPLACEMENT
  }
  private PlacementLocation_? : IfcVirtualGridIntersection
  private PlacementRefDirection_? : IfcDirection | IfcVirtualGridIntersection | null

  public get PlacementLocation() : IfcVirtualGridIntersection {
    if ( this.PlacementLocation_ === void 0 ) {
      this.PlacementLocation_ = this.extractElement( 1, 1, 1, false, IfcVirtualGridIntersection )
    }

    return this.PlacementLocation_ as IfcVirtualGridIntersection
  }

  public get PlacementRefDirection() : IfcDirection | IfcVirtualGridIntersection | null {
    if ( this.PlacementRefDirection_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 2, 1, 1, true )

      if ( !( value instanceof IfcDirection ) && !( value instanceof IfcVirtualGridIntersection ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.PlacementRefDirection_ = value as (IfcDirection | IfcVirtualGridIntersection)

    }

    return this.PlacementRefDirection_ as IfcDirection | IfcVirtualGridIntersection | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcGridPlacement.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcGridPlacement" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCGRIDPLACEMENT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCGRIDPLACEMENT
}
