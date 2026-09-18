
import { IfcExternalReference } from "./index"
import { IfcClassification } from "./index"
import { IfcText } from "./index"
import { IfcIdentifier } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcClassificationReference extends IfcExternalReference {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCCLASSIFICATIONREFERENCE
  }
  private ReferencedSource_? : IfcClassification | IfcClassificationReference | null
  private Description_? : string | null
  private Sort_? : string | null

  public get ReferencedSource() : IfcClassification | IfcClassificationReference | null {
    if ( this.ReferencedSource_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 3, 3, 1, true )

      if ( !( value instanceof IfcClassification ) && !( value instanceof IfcClassificationReference ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.ReferencedSource_ = value as (IfcClassification | IfcClassificationReference)

    }

    return this.ReferencedSource_ as IfcClassification | IfcClassificationReference | null
  }

  public get Description() : string | null {
    if ( this.Description_ === void 0 ) {
      this.Description_ = this.extractString( 4, 3, 1, true )
    }

    return this.Description_ as string | null
  }

  public get Sort() : string | null {
    if ( this.Sort_ === void 0 ) {
      this.Sort_ = this.extractString( 5, 3, 1, true )
    }

    return this.Sort_ as string | null
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcClassificationReference.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcClassificationReference" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCLASSIFICATIONREFERENCE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCCLASSIFICATIONREFERENCE
}
