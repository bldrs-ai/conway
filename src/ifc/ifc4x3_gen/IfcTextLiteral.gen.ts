
import { IfcGeometricRepresentationItem } from "./index"
import { IfcPresentableText } from "./index"
import { IfcAxis2Placement2D } from "./index"
import { IfcAxis2Placement3D } from "./index"
import { IfcTextPath, IfcTextPathDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcTextLiteral extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCTEXTLITERAL
  }
  private Literal_? : string
  private Placement_? : IfcAxis2Placement2D | IfcAxis2Placement3D
  private Path_? : IfcTextPath

  public get Literal() : string {
    if ( this.Literal_ === void 0 ) {
      this.Literal_ = this.extractString( 0, 0, 2, false )
    }

    return this.Literal_ as string
  }

  public get Placement() : IfcAxis2Placement2D | IfcAxis2Placement3D {
    if ( this.Placement_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
        this.extractReference( 1, 0, 2, false )

      if ( !( value instanceof IfcAxis2Placement2D ) && !( value instanceof IfcAxis2Placement3D ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.Placement_ = value as (IfcAxis2Placement2D | IfcAxis2Placement3D)

    }

    return this.Placement_ as IfcAxis2Placement2D | IfcAxis2Placement3D
  }

  public get Path() : IfcTextPath {
    if ( this.Path_ === void 0 ) {
      this.Path_ = this.extractLambda( 2, 0, 2, IfcTextPathDeserializeStep, false )
    }

    return this.Path_ as IfcTextPath
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcTextLiteral.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcTextLiteral" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCTEXTLITERAL, EntityTypesIfc4x3.IFCTEXTLITERALWITHEXTENT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCTEXTLITERAL
}
