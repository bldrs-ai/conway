
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcAlignmentParameterSegment extends StepEntityBase< EntityTypesIfc4x3 > {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCALIGNMENTPARAMETERSEGMENT
  }
  private StartTag_? : string | null
  private EndTag_? : string | null

  public get StartTag() : string | null {
    if ( this.StartTag_ === void 0 ) {
      this.StartTag_ = this.extractString( 0, 0, 0, true )
    }

    return this.StartTag_ as string | null
  }

  public get EndTag() : string | null {
    if ( this.EndTag_ === void 0 ) {
      this.EndTag_ = this.extractString( 1, 0, 0, true )
    }

    return this.EndTag_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcAlignmentParameterSegment.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcAlignmentParameterSegment" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCALIGNMENTCANTSEGMENT, EntityTypesIfc4x3.IFCALIGNMENTHORIZONTALSEGMENT, EntityTypesIfc4x3.IFCALIGNMENTVERTICALSEGMENT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCALIGNMENTPARAMETERSEGMENT
}
