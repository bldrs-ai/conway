
import { IfcOffsetCurve } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcLogical } from "./index"
import { IfcDirection } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcOffsetCurve3D extends IfcOffsetCurve {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCOFFSETCURVE3D
  }
  private Distance_? : number
  private SelfIntersect_? : boolean | null
  private RefDirection_? : IfcDirection

  public get Distance() : number {
    if ( this.Distance_ === void 0 ) {
      this.Distance_ = this.extractNumber( 1, 1, 4, false )
    }

    return this.Distance_ as number
  }

  public get SelfIntersect() : boolean | null {
    if ( this.SelfIntersect_ === void 0 ) {
      this.SelfIntersect_ = this.extractLogical( 2, 1, 4, false )
    }

    return this.SelfIntersect_ as boolean | null
  }

  public get RefDirection() : IfcDirection {
    if ( this.RefDirection_ === void 0 ) {
      this.RefDirection_ = this.extractElement( 3, 1, 4, false, IfcDirection )
    }

    return this.RefDirection_ as IfcDirection
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcOffsetCurve3D.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcOffsetCurve3D" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCOFFSETCURVE3D ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCOFFSETCURVE3D
}
