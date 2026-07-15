import ParsingBuffer from '../parsing/parsing_buffer'
import StepParser, {ParseProgressCallback, ParseResult} from '../step/parsing/step_parser'
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
   *
   * @param input The parsing buffer, set to user data, to read.
   * @param onProgress Optional byte-cursor progress callback for the data parse.
   * @return {[ParseResult, AP214StepModel | undefined]} The parse result as well as the model,
   * if it can be extracted.
   */
  public parseDataToModel(
      input: ParsingBuffer,
      onProgress?: ParseProgressCallback ): [ParseResult, AP214StepModel | undefined] {
    const [itemIndex, parseResult] = this.parseDataBlock( input, onProgress )

    return [parseResult, new AP214StepModel( input.buffer, itemIndex.elements )]
  }

  /**
   * Cooperative variant of parseDataToModel — periodically yields to the
   * event loop mid-parse (see StepParser.parseDataBlockAsync, issue #301 §2).
   *
   * @param input The parsing buffer, set to user data, to read.
   * @param onProgress Optional byte-cursor progress callback for the data parse.
   * @return {Promise<[ParseResult, AP214StepModel | undefined]>} The parse result as well
   * as the model, if it can be extracted.
   */
  public async parseDataToModelAsync(
      input: ParsingBuffer,
      onProgress?: ParseProgressCallback ):
      Promise<[ParseResult, AP214StepModel | undefined]> {
    const [itemIndex, parseResult] = await this.parseDataBlockAsync( input, onProgress )

    return [parseResult, new AP214StepModel( input.buffer, itemIndex.elements )]
  }
}
