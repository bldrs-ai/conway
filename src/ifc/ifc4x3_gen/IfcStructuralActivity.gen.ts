
import { IfcProduct } from "./index"
import { IfcStructuralLoad } from "./index"
import { IfcGlobalOrLocalEnum, IfcGlobalOrLocalEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcStructuralActivity extends IfcProduct {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSTRUCTURALACTIVITY
  }
  private AppliedLoad_? : IfcStructuralLoad
  private GlobalOrLocal_? : IfcGlobalOrLocalEnum

  public get AppliedLoad() : IfcStructuralLoad {
    if ( this.AppliedLoad_ === void 0 ) {
      this.AppliedLoad_ = this.extractElement( 7, 7, 4, false, IfcStructuralLoad )
    }

    return this.AppliedLoad_ as IfcStructuralLoad
  }

  public get GlobalOrLocal() : IfcGlobalOrLocalEnum {
    if ( this.GlobalOrLocal_ === void 0 ) {
      this.GlobalOrLocal_ = this.extractLambda( 8, 7, 4, IfcGlobalOrLocalEnumDeserializeStep, false )
    }

    return this.GlobalOrLocal_ as IfcGlobalOrLocalEnum
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcStructuralActivity.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcStructuralActivity" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSTRUCTURALCURVEACTION, EntityTypesIfc4x3.IFCSTRUCTURALPOINTACTION, EntityTypesIfc4x3.IFCSTRUCTURALSURFACEACTION, EntityTypesIfc4x3.IFCSTRUCTURALLINEARACTION, EntityTypesIfc4x3.IFCSTRUCTURALPLANARACTION, EntityTypesIfc4x3.IFCSTRUCTURALCURVEREACTION, EntityTypesIfc4x3.IFCSTRUCTURALPOINTREACTION, EntityTypesIfc4x3.IFCSTRUCTURALSURFACEREACTION ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSTRUCTURALACTIVITY
}
