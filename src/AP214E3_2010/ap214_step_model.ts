import EntityTypesAP214 from './AP214E3_2010_gen/entity_types_ap214.gen'
import StepModelBase from '../step/step_model_base'
import SchemaAP214Tessellated, {
  EntityTypesAP214ExtendedCount,
} from './ap214_tessellated_types'
import {StepIndexEntry} from '../step/parsing/step_parser'
import {StepIndexColumns} from '../step/parsing/columnar_index'
import {StepTypeIndexer} from '../step/indexing/step_type_indexer'
import {MultiIndexSet} from '../indexing/multi_index_set'
import { AP214ModelGeometry } from './ap214_model_geometry'
import { AP214ModelProfile } from './ap214_model_profile'
import AP214StepExternalMapping from './ap214_step_external_mapping'
import { AP214MaterialCache } from './ap214_material_cache'
import AP214ModelCurves from './ap214_model_curves'
import { CsgMemoization } from '../core/csg_operations'


// Sized for the extended schema — the AP242 shadow types (see
// ap214_tessellated_types.ts) are allocated past the generated enum, so an
// indexer built to the generated count would index off the end of its
// counters for them.
const indexerInstance = new StepTypeIndexer< EntityTypesAP214 >( EntityTypesAP214ExtendedCount )

/**
 * Represents an IFC model deserialized from step.
 */
export default class AP214StepModel extends StepModelBase< EntityTypesAP214 > {

  public readonly typeIndex: MultiIndexSet< EntityTypesAP214 >
  public readonly externalMappingType = AP214StepExternalMapping
  public readonly geometry = new AP214ModelGeometry()
  public readonly materials = new AP214MaterialCache()
  public readonly profiles = new AP214ModelProfile()
  public readonly curves = new AP214ModelCurves(this)
  public readonly csgOperations = new CsgMemoization()

  /**
   * Construct this model given a buffer containing the data and the parsed data index on that,
   * adding the typeIndex on top of that.
   *
   * @param buffer The buffer to values from.
   * @param elementIndex The parsed index to elements in the STEP.
   */
  constructor(
      buffer: Uint8Array,
      elementIndex: StepIndexEntry< EntityTypesAP214 >[] | StepIndexColumns< EntityTypesAP214 > ) {
    super( SchemaAP214Tessellated, buffer, elementIndex )

    this.typeIndex = indexerInstance.createFor( elementIndex )
  }
}
