
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
