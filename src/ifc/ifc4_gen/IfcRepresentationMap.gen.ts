
import { IfcAxis2Placement2D } from "./index"
import { IfcAxis2Placement3D } from "./index"
import { IfcRepresentation } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrepresentationmap.htm */
export  class IfcRepresentationMap extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCREPRESENTATIONMAP
  }
  private MappingOrigin_? : IfcAxis2Placement2D | IfcAxis2Placement3D
  private MappedRepresentation_? : IfcRepresentation

  public get MappingOrigin() : IfcAxis2Placement2D | IfcAxis2Placement3D {
    if ( this.MappingOrigin_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc > = 
        this.extractReference( 0, 0, 0, false )

      if ( !( value instanceof IfcAxis2Placement2D ) && !( value instanceof IfcAxis2Placement3D ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.MappingOrigin_ = value as (IfcAxis2Placement2D | IfcAxis2Placement3D)

    }

    return this.MappingOrigin_ as IfcAxis2Placement2D | IfcAxis2Placement3D
  }

  public get MappedRepresentation() : IfcRepresentation {
    if ( this.MappedRepresentation_ === void 0 ) {
      this.MappedRepresentation_ = this.extractElement( 1, 0, 0, false, IfcRepresentation )
    }

    return this.MappedRepresentation_ as IfcRepresentation
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCREPRESENTATIONMAP ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCREPRESENTATIONMAP
}
