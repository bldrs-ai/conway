
import { IfcElementComponentType } from "./index"
import { IfcMechanicalFastenerTypeEnum, IfcMechanicalFastenerTypeEnumDeserializeStep } from "./index"
import { IfcPositiveLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcmechanicalfastenertype.htm */
export  class IfcMechanicalFastenerType extends IfcElementComponentType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCMECHANICALFASTENERTYPE
  }
  private PredefinedType_? : IfcMechanicalFastenerTypeEnum
  private NominalDiameter_? : number | null
  private NominalLength_? : number | null

  public get PredefinedType() : IfcMechanicalFastenerTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 6, IfcMechanicalFastenerTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcMechanicalFastenerTypeEnum
  }

  public get NominalDiameter() : number | null {
    if ( this.NominalDiameter_ === void 0 ) {
      this.NominalDiameter_ = this.extractNumber( 10, 9, 6, true )
    }

    return this.NominalDiameter_ as number | null
  }

  public get NominalLength() : number | null {
    if ( this.NominalLength_ === void 0 ) {
      this.NominalLength_ = this.extractNumber( 11, 9, 6, true )
    }

    return this.NominalLength_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCMECHANICALFASTENERTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCMECHANICALFASTENERTYPE
}
