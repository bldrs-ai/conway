export type EncodedToken            = Uint8Array;
export type EncodedUnicodeCharacter = number;

const encoder = new TextEncoder()

/**
 * Encode a token as UTF8 bytes.
 * @param from The string version of the token to encode.
 * @returns The UTF8 encoded token.
 */
export function encodeToken( from: string ): EncodedToken {
  return encoder.encode( from )
}

/**
 * Encode a character into a unicode code point
 * @param from The string to get the character from.
 * @param offset The offset of the character to encode.
 * @returns The encoded character number.
 */
export function encodeCharacter( from: string, offset: number = 0 ): EncodedUnicodeCharacter {
  return from.charCodeAt( offset ) ?? 0
}

/**
 * Class used to support matching a particular token
 */
export default class TokenMatch {
  private readonly encoded_: Uint8Array

  /**
   * Create this with a string that is translated to a UTF8 token to match in binary.
   * @param from The string to create this from.
   */
  constructor( from: string ) {
    this.encoded_ = encodeToken( from )
  }

  /**
   * The matching function for the token.
   * @param buffer The buffer to match the token in.
   * @param cursor The position in the buffer to match the token at.
   * @param endCursor The end position in the buffer to finish the match search.
   * @returns The cursor that corresponds to the end of the match for the token.
   */
  public match = ( buffer: Uint8Array, cursor: number, endCursor: number ): number | undefined => {
    const encoded     = this.encoded_
    const tokenLength = encoded.length

    let tokenCursor = 0

    while ( cursor < endCursor && tokenCursor < tokenLength ) {
      if ( buffer[ cursor ] !== encoded[ tokenCursor ] ) {
        break
      }

      ++cursor
      ++tokenCursor
    }

    return tokenCursor === tokenLength ? cursor : undefined
  }

}
