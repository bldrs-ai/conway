import { ModelInfo } from '../core/progress_log'
import { StepHeader } from '../step/parsing/step_parser'


/**
 * Parse a FILE_HEADER header from a STEP file to extract relevant info.
 *
 * @param input - FILE_HEADER from step header
 * @return {string[]} array of fields in FILE_NAME
 */
export function parseFileHeader(input: string): string[] {
  const result: string[] = []
  let currentSegment = ''
  let parenthesesCount = 0

  for (const char of input) {
    if (char === '(') {
      parenthesesCount++
    } else if (char === ')') {
      parenthesesCount--
    }

    if (char === ',' && parenthesesCount === 0) {
      result.push(currentSegment.trim())
      currentSegment = ''
    } else {
      currentSegment += char
    }
  }

  // Add the last segment if it's not empty
  if (currentSegment.trim() !== '') {
    result.push(currentSegment.trim())
  }

  return result
}


// FILE_NAME field positions per ISO 10303-21:
// (name, time_stamp, author, organization, preprocessor_version,
//  originating_system, authorization)
const FILE_NAME_NAME = 0
const FILE_NAME_PREPROCESSOR = 5
const FILE_NAME_ORIGINATING_SYSTEM = 6

/**
 * Extract the early model line's fields from a parsed STEP header — this is
 * everything we can know before the full file parse (issue #301 follow-up:
 * "output this as early as possible"). Values are unquoted for display.
 *
 * @param stepHeader The parsed STEP header.
 * @param byteLength The source buffer size in bytes.
 * @return {ModelInfo} The extracted info (fields undefined when absent).
 */
export function extractModelInfo( stepHeader: StepHeader, byteLength: number ): ModelInfo {

  const info: ModelInfo = { byteLength }

  const schemaRaw = stepHeader.headers.get( 'FILE_SCHEMA' )

  if ( schemaRaw !== void 0 ) {
    // Shaped like (('IFC4')) / (('AP214...')): pull the first quoted token.
    const match = schemaRaw.match( /'([^']+)'/ )

    info.schema = match !== null ? match[ 1 ] : schemaRaw
  }

  let fileNameRaw = stepHeader.headers.get( 'FILE_NAME' )

  if ( fileNameRaw !== void 0 ) {
    // strip start / end parenthesis (mirrors the statistics path)
    fileNameRaw = fileNameRaw.substring( 1, fileNameRaw.length - 1 )

    const fields = parseFileHeader( fileNameRaw )

    const unquote = ( value: string | undefined ): string | undefined => {
      if ( value === void 0 ) {
        return void 0
      }

      const trimmed = value.trim()

      return trimmed.replace( /^'/, '' ).replace( /'$/, '' )
    }

    const name = unquote( fields[ FILE_NAME_NAME ] )

    if ( name !== void 0 && name !== '' ) {
      info.fileName = name
    }

    info.preprocessorVersion = unquote( fields[ FILE_NAME_PREPROCESSOR ] )
    info.originatingSystem = unquote( fields[ FILE_NAME_ORIGINATING_SYSTEM ] )
  }

  return info
}
