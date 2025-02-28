import EntityTypesAP214, {EntityTypesAP214Count} from './AP214E3_2010_gen/entity_types_ap214.gen'
import StepModelBase from '../step/step_model_base'
import SchemaAP214 from './AP214E3_2010_gen/schema_ap214.gen'
import {StepIndexEntry} from '../step/parsing/step_parser'
import {StepTypeIndexer} from '../step/indexing/step_type_indexer'
import {MultiIndexSet} from '../indexing/multi_index_set'
import { AP214ModelGeometry } from './ap214_model_geometry'
import { AP214ModelProfile } from './ap214_model_profile'
import AP214StepExternalMapping from './ap214_step_external_mapping'
import { AP214MaterialCache } from './ap214_material_cache'


const indexerInstance = new StepTypeIndexer< EntityTypesAP214 >( EntityTypesAP214Count )

/**
 * Represents an IFC model deserialized from step.
 */
export default class AP214StepModel extends StepModelBase< EntityTypesAP214 > {

  public readonly typeIndex: MultiIndexSet< EntityTypesAP214 >
  public readonly externalMappingType = AP214StepExternalMapping
  public readonly geometry = new AP214ModelGeometry()
  public readonly materials = new AP214MaterialCache()
  public readonly profiles = new AP214ModelProfile()

  /**
   * Construct this model given a buffer containing the data and the parsed data index on that,
   * adding the typeIndex on top of that.
   *
   * @param buffer The buffer to values from.
   * @param elementIndex The parsed index to elements in the STEP.
   */
  constructor(
      buffer: Uint8Array,
      elementIndex: StepIndexEntry< EntityTypesAP214 >[] ) {
    super( SchemaAP214, buffer, elementIndex )

    this.typeIndex = indexerInstance.create( elementIndex )
  }
}
