
import { IfcPropertyAbstraction } from "./index"
import { IfcIdentifier } from "./index"
import { IfcText } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcProperty extends IfcPropertyAbstraction {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCPROPERTY
  }
  private Name_? : string
  private Specification_? : string | null

  public get Name() : string {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 0, 0, 1, false )
    }

    return this.Name_ as string
  }

  public get Specification() : string | null {
    if ( this.Specification_ === void 0 ) {
      this.Specification_ = this.extractString( 1, 0, 1, true )
    }

    return this.Specification_ as string | null
  }






  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcProperty.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcProperty" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCOMPLEXPROPERTY, EntityTypesIfc4x3.IFCPROPERTYBOUNDEDVALUE, EntityTypesIfc4x3.IFCPROPERTYENUMERATEDVALUE, EntityTypesIfc4x3.IFCPROPERTYLISTVALUE, EntityTypesIfc4x3.IFCPROPERTYREFERENCEVALUE, EntityTypesIfc4x3.IFCPROPERTYSINGLEVALUE, EntityTypesIfc4x3.IFCPROPERTYTABLEVALUE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCPROPERTY
}
