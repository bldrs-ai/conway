
import { IfcTessellatedItem } from "./index"
import { IfcCartesianPointList3D } from "./index"
import { IfcDimensionCount } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctessellatedfaceset.htm */
export abstract class IfcTessellatedFaceSet extends IfcTessellatedItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTESSELLATEDFACESET
  }
  private Coordinates_? : IfcCartesianPointList3D

  public get Coordinates() : IfcCartesianPointList3D {
    if ( this.Coordinates_ === void 0 ) {
      this.Coordinates_ = this.extractElement( 0, 0, 3, false, IfcCartesianPointList3D )
    }

    return this.Coordinates_ as IfcCartesianPointList3D
  }

  public get Dim() : number {
    return 3;
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPOLYGONALFACESET, EntityTypesIfc.IFCTRIANGULATEDFACESET ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTESSELLATEDFACESET
}
