
import { IfcCurve } from "./index"
import { IfcCartesianPoint } from "./index"
import { IfcVector } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcLine extends IfcCurve {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCLINE
  }
  private Pnt_? : IfcCartesianPoint
  private Dir_? : IfcVector

  public get Pnt() : IfcCartesianPoint {
    if ( this.Pnt_ === void 0 ) {
      this.Pnt_ = this.extractElement( 0, 0, 3, false, IfcCartesianPoint )
    }

    return this.Pnt_ as IfcCartesianPoint
  }

  public get Dir() : IfcVector {
    if ( this.Dir_ === void 0 ) {
      this.Dir_ = this.extractElement( 1, 0, 3, false, IfcVector )
    }

    return this.Dir_ as IfcVector
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcLine.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcLine" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCLINE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCLINE
}
