
import { IfcGeometricRepresentationItem } from "./index"
import { IfcPresentableText } from "./index"
import { IfcAxis2Placement2D } from "./index"
import { IfcAxis2Placement3D } from "./index"
import { IfcTextPath, IfcTextPathDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctextliteral.htm */
export  class IfcTextLiteral extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTEXTLITERAL
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
      
      const value : StepEntityBase< EntityTypesIfc > = 
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCTEXTLITERAL, EntityTypesIfc.IFCTEXTLITERALWITHEXTENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTEXTLITERAL
}
