
import { IfcGeometricRepresentationItem } from "./index"
import { IfcCartesianPoint } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcDimensionCount } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcBoundingBox extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCBOUNDINGBOX
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcBoundingBox.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcBoundingBox" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCBOUNDINGBOX ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCBOUNDINGBOX
}
