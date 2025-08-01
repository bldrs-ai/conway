
import { IfcGeometricRepresentationItem } from "./index"
import { IfcLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcplanarextent.htm */
export  class IfcPlanarExtent extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPLANAREXTENT
  }
  private SizeInX_? : number
  private SizeInY_? : number

  public get SizeInX() : number {
    if ( this.SizeInX_ === void 0 ) {
      this.SizeInX_ = this.extractNumber( 0, 0, 2, false )
    }

    return this.SizeInX_ as number
  }

  public get SizeInY() : number {
    if ( this.SizeInY_ === void 0 ) {
      this.SizeInY_ = this.extractNumber( 1, 0, 2, false )
    }

    return this.SizeInY_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPLANAREXTENT, EntityTypesIfc.IFCPLANARBOX ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPLANAREXTENT
}
