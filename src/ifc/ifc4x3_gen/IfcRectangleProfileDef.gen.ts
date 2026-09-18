
import { IfcParameterizedProfileDef } from "./index"
import { IfcPositiveLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcRectangleProfileDef extends IfcParameterizedProfileDef {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRECTANGLEPROFILEDEF
  }
  private XDim_? : number
  private YDim_? : number

  public get XDim() : number {
    if ( this.XDim_ === void 0 ) {
      this.XDim_ = this.extractNumber( 3, 3, 2, false )
    }

    return this.XDim_ as number
  }

  public get YDim() : number {
    if ( this.YDim_ === void 0 ) {
      this.YDim_ = this.extractNumber( 4, 3, 2, false )
    }

    return this.YDim_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRectangleProfileDef.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRectangleProfileDef" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRECTANGLEPROFILEDEF, EntityTypesIfc4x3.IFCRECTANGLEHOLLOWPROFILEDEF, EntityTypesIfc4x3.IFCROUNDEDRECTANGLEPROFILEDEF ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRECTANGLEPROFILEDEF
}
