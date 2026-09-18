
import { IfcGeometricRepresentationItem } from "./index"
import { IfcPoint } from "./index"
import { IfcDimensionCount } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcPlacement extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCPLACEMENT
  }
  private Location_? : IfcPoint

  public get Location() : IfcPoint {
    if ( this.Location_ === void 0 ) {
      this.Location_ = this.extractElement( 0, 0, 2, false, IfcPoint )
    }

    return this.Location_ as IfcPoint
  }

  public get Dim() : number {
    return this?.Location?.Dim;
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcPlacement.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcPlacement" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCAXIS1PLACEMENT, EntityTypesIfc4x3.IFCAXIS2PLACEMENT2D, EntityTypesIfc4x3.IFCAXIS2PLACEMENT3D, EntityTypesIfc4x3.IFCAXIS2PLACEMENTLINEAR ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCPLACEMENT
}
