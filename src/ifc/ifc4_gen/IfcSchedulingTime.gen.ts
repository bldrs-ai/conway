
import { IfcLabel } from "./index"
import { IfcDataOriginEnum, IfcDataOriginEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcschedulingtime.htm */
export abstract class IfcSchedulingTime extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSCHEDULINGTIME
  }
  private Name_? : string | null
  private DataOrigin_? : IfcDataOriginEnum | null
  private UserDefinedDataOrigin_? : string | null

  public get Name() : string | null {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 0, 0, 0, true )
    }

    return this.Name_ as string | null
  }

  public get DataOrigin() : IfcDataOriginEnum | null {
    if ( this.DataOrigin_ === void 0 ) {
      this.DataOrigin_ = this.extractLambda( 1, 0, 0, IfcDataOriginEnumDeserializeStep, true )
    }

    return this.DataOrigin_ as IfcDataOriginEnum | null
  }

  public get UserDefinedDataOrigin() : string | null {
    if ( this.UserDefinedDataOrigin_ === void 0 ) {
      this.UserDefinedDataOrigin_ = this.extractString( 2, 0, 0, true )
    }

    return this.UserDefinedDataOrigin_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCEVENTTIME, EntityTypesIfc.IFCLAGTIME, EntityTypesIfc.IFCRESOURCETIME, EntityTypesIfc.IFCTASKTIME, EntityTypesIfc.IFCWORKTIME, EntityTypesIfc.IFCTASKTIMERECURRING ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSCHEDULINGTIME
}
