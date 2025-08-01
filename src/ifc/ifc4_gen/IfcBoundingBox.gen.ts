
import { IfcGeometricRepresentationItem } from "./index"
import { IfcCartesianPoint } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcDimensionCount } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcboundingbox.htm */
export  class IfcBoundingBox extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCBOUNDINGBOX
  }
  private Corner_? : IfcCartesianPoint
  private XDim_? : number
  private YDim_? : number
  private ZDim_? : number

  public get Corner() : IfcCartesianPoint {
    if ( this.Corner_ === void 0 ) {
      this.Corner_ = this.extractElement( 0, 0, 2, false, IfcCartesianPoint )
    }

    return this.Corner_ as IfcCartesianPoint
  }

  public get XDim() : number {
    if ( this.XDim_ === void 0 ) {
      this.XDim_ = this.extractNumber( 1, 0, 2, false )
    }

    return this.XDim_ as number
  }

  public get YDim() : number {
    if ( this.YDim_ === void 0 ) {
      this.YDim_ = this.extractNumber( 2, 0, 2, false )
    }

    return this.YDim_ as number
  }

  public get ZDim() : number {
    if ( this.ZDim_ === void 0 ) {
      this.ZDim_ = this.extractNumber( 3, 0, 2, false )
    }

    return this.ZDim_ as number
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
    [ EntityTypesIfc.IFCBOUNDINGBOX ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCBOUNDINGBOX
}
