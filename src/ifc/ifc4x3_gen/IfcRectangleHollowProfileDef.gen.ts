
import { IfcRectangleProfileDef } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcNonNegativeLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcRectangleHollowProfileDef extends IfcRectangleProfileDef {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRECTANGLEHOLLOWPROFILEDEF
  }
  private WallThickness_? : number
  private InnerFilletRadius_? : number | null
  private OuterFilletRadius_? : number | null

  public get WallThickness() : number {
    if ( this.WallThickness_ === void 0 ) {
      this.WallThickness_ = this.extractNumber( 5, 5, 3, false )
    }

    return this.WallThickness_ as number
  }

  public get InnerFilletRadius() : number | null {
    if ( this.InnerFilletRadius_ === void 0 ) {
      this.InnerFilletRadius_ = this.extractNumber( 6, 5, 3, true )
    }

    return this.InnerFilletRadius_ as number | null
  }

  public get OuterFilletRadius() : number | null {
    if ( this.OuterFilletRadius_ === void 0 ) {
      this.OuterFilletRadius_ = this.extractNumber( 7, 5, 3, true )
    }

    return this.OuterFilletRadius_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRectangleHollowProfileDef.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRectangleHollowProfileDef" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRECTANGLEHOLLOWPROFILEDEF ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRECTANGLEHOLLOWPROFILEDEF
}
