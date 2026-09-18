
import { IfcTypeObject } from "./index"
import { IfcIdentifier } from "./index"
import { IfcText } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcTypeProcess extends IfcTypeObject {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCTYPEPROCESS
  }
  private Identification_? : string | null
  private LongDescription_? : string | null
  private ProcessType_? : string | null

  public get Identification() : string | null {
    if ( this.Identification_ === void 0 ) {
      this.Identification_ = this.extractString( 6, 6, 3, true )
    }

    return this.Identification_ as string | null
  }

  public get LongDescription() : string | null {
    if ( this.LongDescription_ === void 0 ) {
      this.LongDescription_ = this.extractString( 7, 6, 3, true )
    }

    return this.LongDescription_ as string | null
  }

  public get ProcessType() : string | null {
    if ( this.ProcessType_ === void 0 ) {
      this.ProcessType_ = this.extractString( 8, 6, 3, true )
    }

    return this.ProcessType_ as string | null
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcTypeProcess.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcTypeProcess" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCEVENTTYPE, EntityTypesIfc4x3.IFCPROCEDURETYPE, EntityTypesIfc4x3.IFCTASKTYPE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCTYPEPROCESS
}
