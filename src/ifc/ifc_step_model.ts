import EntityTypesIfc, {EntityTypesIfcCount} from './ifc4_gen/entity_types_ifc.gen'
import StepModelBase from '../step/step_model_base'
import SchemaIfc from './ifc4_gen/schema_ifc.gen'
import {StepIndexEntry} from '../step/parsing/step_parser'
import {StepTypeIndexer} from '../step/indexing/step_type_indexer'
import {MultiIndexSet} from '../indexing/multi_index_set'
import { IfcModelGeometry } from './ifc_model_geometry'
import { IfcModelProfile } from './ifc_model_profile'
import IfcStepExternalMapping from './ifc_step_external_mapping'
import IfcModelCurves from './ifc_model_curves'
import { CsgMemoization } from '../core/csg_operations'
import { IfcMaterialCache } from './ifc_material_cache'


const indexerInstance = new StepTypeIndexer< EntityTypesIfc >( EntityTypesIfcCount )

/**
 * Represents an IFC model deserialized from step.
 */
export default class IfcStepModel extends StepModelBase< EntityTypesIfc > {

  public readonly typeIndex: MultiIndexSet< EntityTypesIfc >
  public readonly externalMappingType = IfcStepExternalMapping
  public readonly geometry = new IfcModelGeometry( this )
  public readonly voidGeometry = new IfcModelGeometry( this, true )
  public readonly profiles = new IfcModelProfile(this)
  public readonly curves = new IfcModelCurves(this)
  public readonly csgOperations = new CsgMemoization()
  public readonly materials = new IfcMaterialCache( this )
  public readonly voidMaterials = new IfcMaterialCache( this, true )

  /**
   * Construct this model given a buffer containing the data and the parsed data index on that,
   * adding the typeIndex on top of that.
   *
   * @param wasmModule
   * @param buffer The buffer to values from.
   * @param elementIndex The parsed index to elements in the STEP.
   */
  constructor(
      buffer: Uint8Array,
      elementIndex: StepIndexEntry< EntityTypesIfc >[] ) {
    super( SchemaIfc, buffer, elementIndex )

    this.typeIndex = indexerInstance.create( elementIndex )
  }
}
