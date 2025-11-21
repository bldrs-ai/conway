
import { IfcGeometricRepresentationItem } from "./index"
import { IfcDimensionCount } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcsolidmodel.htm */
export abstract class IfcSolidModel extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSOLIDMODEL
  }


  public get Dim() : number {
    return 3;
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCSGSOLID, EntityTypesIfc.IFCSWEPTDISKSOLID, EntityTypesIfc.IFCADVANCEDBREP, EntityTypesIfc.IFCFACETEDBREP, EntityTypesIfc.IFCADVANCEDBREPWITHVOIDS, EntityTypesIfc.IFCFACETEDBREPWITHVOIDS, EntityTypesIfc.IFCEXTRUDEDAREASOLID, EntityTypesIfc.IFCFIXEDREFERENCESWEPTAREASOLID, EntityTypesIfc.IFCREVOLVEDAREASOLID, EntityTypesIfc.IFCSURFACECURVESWEPTAREASOLID, EntityTypesIfc.IFCEXTRUDEDAREASOLIDTAPERED, EntityTypesIfc.IFCREVOLVEDAREASOLIDTAPERED, EntityTypesIfc.IFCSWEPTDISKSOLIDPOLYGONAL ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSOLIDMODEL
}
