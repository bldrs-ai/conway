
import { IfcGeometricRepresentationItem } from "./index"
import { IfcDimensionCount } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcSolidModel extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSOLIDMODEL
  }


  public get Dim() : number {
    return 3;
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcSolidModel.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcSolidModel" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCSGSOLID, EntityTypesIfc4x3.IFCSWEPTDISKSOLID, EntityTypesIfc4x3.IFCADVANCEDBREP, EntityTypesIfc4x3.IFCFACETEDBREP, EntityTypesIfc4x3.IFCADVANCEDBREPWITHVOIDS, EntityTypesIfc4x3.IFCFACETEDBREPWITHVOIDS, EntityTypesIfc4x3.IFCSECTIONEDSOLIDHORIZONTAL, EntityTypesIfc4x3.IFCEXTRUDEDAREASOLID, EntityTypesIfc4x3.IFCREVOLVEDAREASOLID, EntityTypesIfc4x3.IFCFIXEDREFERENCESWEPTAREASOLID, EntityTypesIfc4x3.IFCSURFACECURVESWEPTAREASOLID, EntityTypesIfc4x3.IFCDIRECTRIXDERIVEDREFERENCESWEPTAREASOLID, EntityTypesIfc4x3.IFCEXTRUDEDAREASOLIDTAPERED, EntityTypesIfc4x3.IFCREVOLVEDAREASOLIDTAPERED, EntityTypesIfc4x3.IFCSWEPTDISKSOLIDPOLYGONAL ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSOLIDMODEL
}
