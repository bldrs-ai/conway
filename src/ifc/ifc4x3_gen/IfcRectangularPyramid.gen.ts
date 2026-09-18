
import { IfcCsgPrimitive3D } from "./index"
import { IfcPositiveLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcRectangularPyramid extends IfcCsgPrimitive3D {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRECTANGULARPYRAMID
  }
  private XLength_? : number
  private YLength_? : number
  private Height_? : number

  public get XLength() : number {
    if ( this.XLength_ === void 0 ) {
      this.XLength_ = this.extractNumber( 1, 1, 3, false )
    }

    return this.XLength_ as number
  }

  public get YLength() : number {
    if ( this.YLength_ === void 0 ) {
      this.YLength_ = this.extractNumber( 2, 1, 3, false )
    }

    return this.YLength_ as number
  }

  public get Height() : number {
    if ( this.Height_ === void 0 ) {
      this.Height_ = this.extractNumber( 3, 1, 3, false )
    }

    return this.Height_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRectangularPyramid.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRectangularPyramid" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRECTANGULARPYRAMID ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRECTANGULARPYRAMID
}
