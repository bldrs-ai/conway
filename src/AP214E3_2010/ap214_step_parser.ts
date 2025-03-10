import ParsingBuffer from '../parsing/parsing_buffer'
import StepParser, {ParseResult} from '../step/parsing/step_parser'
import AP214StepModel from './ap214_step_model'
import EntityTypesAP214 from './AP214E3_2010_gen/entity_types_ap214.gen'
import EntitTypesIfcSearch from './AP214E3_2010_gen/entity_types_search.gen'

/**
 * Parser for taking IFC file serialized in step and turning them into a lazily parsed model.
 */
export default class AP214StepParser extends StepParser< EntityTypesAP214 > {
  /**
   * Construct the IFC step parser.
   */
  constructor() {
    super( EntitTypesIfcSearch )
  }

  /**
   * An easily accessible and re-usable instance of the parser.
   *
   * Note the parser itself is free of mutable state in the class, so there's no problems
   * with just using a single one.
   */
  public static readonly Instance = new AP214StepParser()

  /**
   * Parse data to the model
   * @param input The parsing buffer, set to user data, to read.
   * @returns The parse result as well as the model,
   * if it can be extracted.
   */
  public parseDataToModel(
      input: ParsingBuffer ): [ParseResult, AP214StepModel | undefined] {
    const [itemIndex, parseResult] = this.parseDataBlock( input )

    return [parseResult, new AP214StepModel( input.buffer, itemIndex.elements )]
  }
}
