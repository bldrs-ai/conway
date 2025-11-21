
import { IfcElementComponent } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcMechanicalFastenerTypeEnum, IfcMechanicalFastenerTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcmechanicalfastener.htm */
export  class IfcMechanicalFastener extends IfcElementComponent {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCMECHANICALFASTENER
  }
  private NominalDiameter_? : number | null
  private NominalLength_? : number | null
  private PredefinedType_? : IfcMechanicalFastenerTypeEnum | null

  public get NominalDiameter() : number | null {
    if ( this.NominalDiameter_ === void 0 ) {
      this.NominalDiameter_ = this.extractNumber( 8, 8, 6, true )
    }

    return this.NominalDiameter_ as number | null
  }

  public get NominalLength() : number | null {
    if ( this.NominalLength_ === void 0 ) {
      this.NominalLength_ = this.extractNumber( 9, 8, 6, true )
    }

    return this.NominalLength_ as number | null
  }

  public get PredefinedType() : IfcMechanicalFastenerTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 10, 8, 6, IfcMechanicalFastenerTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcMechanicalFastenerTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCMECHANICALFASTENER ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCMECHANICALFASTENER
}
