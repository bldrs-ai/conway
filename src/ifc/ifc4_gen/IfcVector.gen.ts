
import { IfcGeometricRepresentationItem } from "./index"
import { IfcDirection } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcDimensionCount } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcvector.htm */
export  class IfcVector extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCVECTOR
  }
  private Orientation_? : IfcDirection
  private Magnitude_? : number

  public get Orientation() : IfcDirection {
    if ( this.Orientation_ === void 0 ) {
      this.Orientation_ = this.extractElement( 0, 0, 2, false, IfcDirection )
    }

    return this.Orientation_ as IfcDirection
  }

  public get Magnitude() : number {
    if ( this.Magnitude_ === void 0 ) {
      this.Magnitude_ = this.extractNumber( 1, 0, 2, false )
    }

    return this.Magnitude_ as number
  }

  public get Dim() : number {
    return this?.Orientation?.Dim;
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCVECTOR ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCVECTOR
}
