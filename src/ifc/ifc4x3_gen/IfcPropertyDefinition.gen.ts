
import { IfcRoot } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcPropertyDefinition extends IfcRoot {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCPROPERTYDEFINITION
  }



  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcPropertyDefinition.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcPropertyDefinition" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCPROPERTYSET, EntityTypesIfc4x3.IFCDOORLININGPROPERTIES, EntityTypesIfc4x3.IFCDOORPANELPROPERTIES, EntityTypesIfc4x3.IFCPERMEABLECOVERINGPROPERTIES, EntityTypesIfc4x3.IFCREINFORCEMENTDEFINITIONPROPERTIES, EntityTypesIfc4x3.IFCWINDOWLININGPROPERTIES, EntityTypesIfc4x3.IFCWINDOWPANELPROPERTIES, EntityTypesIfc4x3.IFCELEMENTQUANTITY, EntityTypesIfc4x3.IFCPROPERTYSETTEMPLATE, EntityTypesIfc4x3.IFCCOMPLEXPROPERTYTEMPLATE, EntityTypesIfc4x3.IFCSIMPLEPROPERTYTEMPLATE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCPROPERTYDEFINITION
}
