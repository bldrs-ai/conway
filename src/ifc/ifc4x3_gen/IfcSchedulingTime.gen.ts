
import { IfcLabel } from "./index"
import { IfcDataOriginEnum, IfcDataOriginEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcSchedulingTime extends StepEntityBase< EntityTypesIfc4x3 > {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSCHEDULINGTIME
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcSchedulingTime.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcSchedulingTime" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCEVENTTIME, EntityTypesIfc4x3.IFCLAGTIME, EntityTypesIfc4x3.IFCRESOURCETIME, EntityTypesIfc4x3.IFCTASKTIME, EntityTypesIfc4x3.IFCWORKTIME, EntityTypesIfc4x3.IFCTASKTIMERECURRING ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSCHEDULINGTIME
}
