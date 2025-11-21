
import { IfcStructuralLoadSingleDisplacement } from "./index"
import { IfcCurvatureMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstructuralloadsingledisplacementdistortion.htm */
export  class IfcStructuralLoadSingleDisplacementDistortion extends IfcStructuralLoadSingleDisplacement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTRUCTURALLOADSINGLEDISPLACEMENTDISTORTION
  }
  private Distortion_? : number | null

  public get Distortion() : number | null {
    if ( this.Distortion_ === void 0 ) {
      this.Distortion_ = this.extractNumber( 7, 7, 4, true )
    }

    return this.Distortion_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSTRUCTURALLOADSINGLEDISPLACEMENTDISTORTION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTRUCTURALLOADSINGLEDISPLACEMENTDISTORTION
}
