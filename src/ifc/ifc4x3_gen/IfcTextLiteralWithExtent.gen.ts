
import { IfcTextLiteral } from "./index"
import { IfcPlanarExtent } from "./index"
import { IfcBoxAlignment } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcTextLiteralWithExtent extends IfcTextLiteral {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCTEXTLITERALWITHEXTENT
  }
  private Extent_? : IfcPlanarExtent
  private BoxAlignment_? : string

  public get Extent() : IfcPlanarExtent {
    if ( this.Extent_ === void 0 ) {
      this.Extent_ = this.extractElement( 3, 3, 3, false, IfcPlanarExtent )
    }

    return this.Extent_ as IfcPlanarExtent
  }

  public get BoxAlignment() : string {
    if ( this.BoxAlignment_ === void 0 ) {
      this.BoxAlignment_ = this.extractString( 4, 3, 3, false )
    }

    return this.BoxAlignment_ as string
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcTextLiteralWithExtent.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcTextLiteralWithExtent" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCTEXTLITERALWITHEXTENT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCTEXTLITERALWITHEXTENT
}
