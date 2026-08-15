/**
 * Lexical scan of a STEP record for `#<expressID>` references.
 *
 * Used to prefetch the source-byte closure a windowed extract will
 * acquire: walking typed attributes requires those records to already
 * be resident, so the walk has to happen on the raw text. Strings
 * (`'...'` with `''` escapes), binary blobs (`"..."`) and C-style
 * comments are skipped so a hash inside a string is not a ref.
 */


const HASH = 0x23
const QUOTE = 0x27
const DQUOTE = 0x22
const ZERO = 0x30
const NINE = 0x39
const SLASH = 0x2F
const STAR = 0x2A


/**
 * Collect the distinct express IDs referenced from a STEP record's
 * bytes. Order is first-seen; `#0` is ignored (not a real entity).
 *
 * @param bytes The record text (or a view containing it).
 * @param from Start offset within `bytes`.
 * @param length Number of bytes to scan.
 * @return {number[]} Distinct referenced express IDs.
 */
export function scanExpressRefs(
    bytes: Uint8Array, from: number = 0, length: number = bytes.length - from ): number[] {

  const refs: number[] = []
  const seen = new Set<number>()
  const end = Math.min( from + length, bytes.length )
  let cursor = from

  while ( cursor < end ) {

    const byte = bytes[ cursor ]

    if ( byte === QUOTE ) {

      cursor = skipQuoted_( bytes, cursor + 1, end, QUOTE, true )
      continue
    }

    if ( byte === DQUOTE ) {

      cursor = skipQuoted_( bytes, cursor + 1, end, DQUOTE, false )
      continue
    }

    if ( byte === SLASH && cursor + 1 < end && bytes[ cursor + 1 ] === STAR ) {

      cursor += 2

      while ( cursor + 1 < end &&
          !( bytes[ cursor ] === STAR && bytes[ cursor + 1 ] === SLASH ) ) {

        ++cursor
      }

      cursor += 2
      continue
    }

    if ( byte === HASH ) {

      let value = 0
      let digit = cursor + 1

      while ( digit < end && bytes[ digit ] >= ZERO && bytes[ digit ] <= NINE ) {

        value = ( value * 10 ) + ( bytes[ digit ] - ZERO )
        ++digit
      }

      if ( digit > cursor + 1 && value !== 0 && !seen.has( value ) ) {

        seen.add( value )
        refs.push( value )
      }

      cursor = digit
      continue
    }

    ++cursor
  }

  return refs
}


/**
 * Advance past a quoted span that started just before `from`.
 *
 * @param bytes Source bytes.
 * @param from First byte after the opening quote.
 * @param end Exclusive scan limit.
 * @param quote The quote byte to match.
 * @param doubledEscape True for STEP strings (`''` is one quote).
 * @return {number} Index just after the closing quote (or `end`).
 */
function skipQuoted_(
    bytes: Uint8Array,
    from: number,
    end: number,
    quote: number,
    doubledEscape: boolean ): number {

  let cursor = from

  while ( cursor < end ) {

    if ( bytes[ cursor ] === quote ) {

      if ( doubledEscape && cursor + 1 < end && bytes[ cursor + 1 ] === quote ) {

        cursor += 2
        continue
      }

      return cursor + 1
    }

    ++cursor
  }

  return end
}
