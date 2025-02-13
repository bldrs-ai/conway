import ParsingConstants from '../../parsing/parsing_constants'
import ParsingDfa16Table from '../../parsing/parsing_dfa_16table'

/**
 * Enum representing the state machine of the string parser DFA.
 */
/* eslint-disable no-shadow, no-unused-vars, no-magic-numbers */
// eslint doesn't really understand enums?
enum STRING_PARSER_STATE {
  TERMINUS = 0,
  REGULAR = 1,
  BSLASH = 2,
  QUOTE = 3,
  SPECIAL = 4,
  SPECIAL_BSLASH = 5
}
/* eslint-enable no-shadow, no-unused-vars, no-magic-numbers */

const STRING_PARSER_TERMINUS_FLAGS = (1 << STRING_PARSER_STATE.QUOTE)
const QUOTE = ParsingConstants.QUOTE
const BSLASH = ParsingConstants.BSLASH
const X = ParsingConstants.CAPITAL_X
const S = ParsingConstants.CAPITAL_S
const P = ParsingConstants.CAPITAL_P
const A = ParsingConstants.A
const I = ParsingConstants.I
const F = ParsingConstants.F
// eslint-disable-next-line no-magic-numbers
const TWO = ParsingConstants.ZERO + 2
// eslint-disable-next-line no-magic-numbers
const FOUR = ParsingConstants.ZERO + 4
const ZERO = ParsingConstants.ZERO
const NINE = ParsingConstants.NINE

const decoder = new TextDecoder()

// eslint-disable-next-line max-len -- Generated code do not edit, do not worry about max-len.
const ISO8859Table = [['¡', '¢', '£', '¤', '¥', '¦', '§', '¨', '©', 'ª', '«', '¬', '­', '®', '¯', '°', '±', '²', '³', '´', 'µ', '¶', '·', '¸', '¹', 'º', '»', '¼', '½', '¾', '¿', 'À', 'Á', 'Â', 'Ã', 'Ä', 'Å', 'Æ', 'Ç', 'È', 'É', 'Ê', 'Ë', 'Ì', 'Í', 'Î', 'Ï', 'Ð', 'Ñ', 'Ò', 'Ó', 'Ô', 'Õ', 'Ö', '×', 'Ø', 'Ù', 'Ú', 'Û', 'Ü', 'Ý', 'Þ', 'ß', 'à', 'á', 'â', 'ã', 'ä', 'å', 'æ', 'ç', 'è', 'é', 'ê', 'ë', 'ì', 'í', 'î', 'ï', 'ð', 'ñ', 'ò', 'ó', 'ô', 'õ', 'ö', '÷', 'ø', 'ù', 'ú', 'û', 'ü', 'ý', 'þ'], ['Ą', '˘', 'Ł', '¤', 'Ľ', 'Ś', '§', '¨', 'Š', 'Ş', 'Ť', 'Ź', '­', 'Ž', 'Ż', '°', 'ą', '˛', 'ł', '´', 'ľ', 'ś', 'ˇ', '¸', 'š', 'ş', 'ť', 'ź', '˝', 'ž', 'ż', 'Ŕ', 'Á', 'Â', 'Ă', 'Ä', 'Ĺ', 'Ć', 'Ç', 'Č', 'É', 'Ę', 'Ë', 'Ě', 'Í', 'Î', 'Ď', 'Đ', 'Ń', 'Ň', 'Ó', 'Ô', 'Ő', 'Ö', '×', 'Ř', 'Ů', 'Ú', 'Ű', 'Ü', 'Ý', 'Ţ', 'ß', 'ŕ', 'á', 'â', 'ă', 'ä', 'ĺ', 'ć', 'ç', 'č', 'é', 'ę', 'ë', 'ě', 'í', 'î', 'ď', 'đ', 'ń', 'ň', 'ó', 'ô', 'ő', 'ö', '÷', 'ř', 'ů', 'ú', 'ű', 'ü', 'ý', 'ţ'], ['Ħ', '˘', '£', '¤', '', 'Ĥ', '§', '¨', 'İ', 'Ş', 'Ğ', 'Ĵ', '­', '', 'Ż', '°', 'ħ', '²', '³', '´', 'µ', 'ĥ', '·', '¸', 'ı', 'ş', 'ğ', 'ĵ', '½', '', 'ż', 'À', 'Á', 'Â', '', 'Ä', 'Ċ', 'Ĉ', 'Ç', 'È', 'É', 'Ê', 'Ë', 'Ì', 'Í', 'Î', 'Ï', '', 'Ñ', 'Ò', 'Ó', 'Ô', 'Ġ', 'Ö', '×', 'Ĝ', 'Ù', 'Ú', 'Û', 'Ü', 'Ŭ', 'Ŝ', 'ß', 'à', 'á', 'â', '', 'ä', 'ċ', 'ĉ', 'ç', 'è', 'é', 'ê', 'ë', 'ì', 'í', 'î', 'ï', '', 'ñ', 'ò', 'ó', 'ô', 'ġ', 'ö', '÷', 'ĝ', 'ù', 'ú', 'û', 'ü', 'ŭ', 'ŝ'], ['Ą', 'ĸ', 'Ŗ', '¤', 'Ĩ', 'Ļ', '§', '¨', 'Š', 'Ē', 'Ģ', 'Ŧ', '­', 'Ž', '¯', '°', 'ą', '˛', 'ŗ', '´', 'ĩ', 'ļ', 'ˇ', '¸', 'š', 'ē', 'ģ', 'ŧ', 'Ŋ', 'ž', 'ŋ', 'Ā', 'Á', 'Â', 'Ã', 'Ä', 'Å', 'Æ', 'Į', 'Č', 'É', 'Ę', 'Ë', 'Ė', 'Í', 'Î', 'Ī', 'Đ', 'Ņ', 'Ō', 'Ķ', 'Ô', 'Õ', 'Ö', '×', 'Ø', 'Ų', 'Ú', 'Û', 'Ü', 'Ũ', 'Ū', 'ß', 'ā', 'á', 'â', 'ã', 'ä', 'å', 'æ', 'į', 'č', 'é', 'ę', 'ë', 'ė', 'í', 'î', 'ī', 'đ', 'ņ', 'ō', 'ķ', 'ô', 'õ', 'ö', '÷', 'ø', 'ų', 'ú', 'û', 'ü', 'ũ', 'ū'], ['Ё', 'Ђ', 'Ѓ', 'Є', 'Ѕ', 'І', 'Ї', 'Ј', 'Љ', 'Њ', 'Ћ', 'Ќ', '­', 'Ў', 'Џ', 'А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'Й', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ', 'Ы', 'Ь', 'Э', 'Ю', 'Я', 'а', 'б', 'в', 'г', 'д', 'е', 'ж', 'з', 'и', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ъ', 'ы', 'ь', 'э', 'ю', 'я', '№', 'ё', 'ђ', 'ѓ', 'є', 'ѕ', 'і', 'ї', 'ј', 'љ', 'њ', 'ћ', 'ќ', '§', 'ў'], ['', '', '', '¤', '', '', '', '', '', '', '', '،', '­', '', '', '', '', '', '', '', '', '', '', '', '', '', '؛', '', '', '', '؟', '', 'ء', 'آ', 'أ', 'ؤ', 'إ', 'ئ', 'ا', 'ب', 'ة', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', '', '', '', '', '', 'ـ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ى', 'ي', 'ً', 'ٌ', 'ٍ', 'َ', 'ُ', 'ِ', 'ّ', 'ْ', '', '', '', '', '', '', '', '', '', '', '', ''], ['ʽ', 'ʼ', '£', '', '', '¦', '§', '¨', '©', '', '«', '¬', '­', '', '―', '°', '±', '²', '³', '΄', '΅', 'Ά', '·', 'Έ', 'Ή', 'Ί', '»', 'Ό', '½', 'Ύ', 'Ώ', 'ΐ', 'Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ', 'Ι', 'Κ', 'Λ', 'Μ', 'Ν', 'Ξ', 'Ο', 'Π', 'Ρ', '', 'Σ', 'Τ', 'Υ', 'Φ', 'Χ', 'Ψ', 'Ω', 'Ϊ', 'Ϋ', 'ά', 'έ', 'ή', 'ί', 'ΰ', 'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ', 'ς', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω', 'ϊ', 'ϋ', 'ό', 'ύ', 'ώ'], ['', '¢', '£', '¤', '¥', '¦', '§', '¨', '©', '×', '«', '¬', '­', '®', '‾', '°', '±', '²', '³', '´', 'µ', '¶', '·', '¸', '¹', '÷', '»', '¼', '½', '¾', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '‗', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'ך', 'כ', 'ל', 'ם', 'מ', 'ן', 'נ', 'ס', 'ע', 'ף', 'פ', 'ץ', 'צ', 'ק', 'ר', 'ש', 'ת', '', '', '', ''], ['¡', '¢', '£', '¤', '¥', '¦', '§', '¨', '©', 'ª', '«', '¬', '­', '®', '¯', '°', '±', '²', '³', '´', 'µ', '¶', '·', '¸', '¹', 'º', '»', '¼', '½', '¾', '¿', 'À', 'Á', 'Â', 'Ã', 'Ä', 'Å', 'Æ', 'Ç', 'È', 'É', 'Ê', 'Ë', 'Ì', 'Í', 'Î', 'Ï', 'Ğ', 'Ñ', 'Ò', 'Ó', 'Ô', 'Õ', 'Ö', '×', 'Ø', 'Ù', 'Ú', 'Û', 'Ü', 'İ', 'Ş', 'ß', 'à', 'á', 'â', 'ã', 'ä', 'å', 'æ', 'ç', 'è', 'é', 'ê', 'ë', 'ì', 'í', 'î', 'ï', 'ğ', 'ñ', 'ò', 'ó', 'ô', 'õ', 'ö', '÷', 'ø', 'ù', 'ú', 'û', 'ü', 'ı', 'ş']]

/**
 * Read the number value from a hex character.
 *
 * @return {number | undefined} The numeric value of the hex character or
 * undefined if it isn't a valid hex character.
 */
function readHex(character: number): number | undefined {
  if (character >= A && character <= F) {

    // eslint-disable-next-line no-magic-numbers
    return (character - A) + 10

  } else if (character >= ZERO && character <= NINE) {

    return character - ZERO
  }

  return undefined
}

/**
 * String parser for step, note we don't do an exact check here, we wait for z
 */
export default class StepStringParser extends ParsingDfa16Table {

  /**
   * Construct this with the DFA lookup table required.
   */
  constructor() {
    super(STRING_PARSER_STATE.SPECIAL_BSLASH)

    // 0xFF is not a magic number, it's a byte mask.
    /* eslint-disable no-magic-numbers */
    this.range(STRING_PARSER_STATE.REGULAR, 0, 0xFF, STRING_PARSER_STATE.REGULAR)
    this.set(STRING_PARSER_STATE.REGULAR, '\\', STRING_PARSER_STATE.BSLASH)
    this.set(STRING_PARSER_STATE.REGULAR, '\'', STRING_PARSER_STATE.QUOTE)

    // double apostrophe case, all others are terminus
    this.set(STRING_PARSER_STATE.QUOTE, '\'', STRING_PARSER_STATE.REGULAR)

    this.range(STRING_PARSER_STATE.BSLASH, 0, 0xFF, STRING_PARSER_STATE.REGULAR)
    this.set(STRING_PARSER_STATE.BSLASH, 'S', STRING_PARSER_STATE.SPECIAL)

    // STEP doesn't seem to have an \' escape
    this.set(STRING_PARSER_STATE.BSLASH, '\'', STRING_PARSER_STATE.QUOTE)

    // Unless we see a backslash after the \S -> regular parsing mode
    this.range(STRING_PARSER_STATE.SPECIAL, 0, 0xFF, STRING_PARSER_STATE.REGULAR)
    this.set(STRING_PARSER_STATE.SPECIAL, '\'', STRING_PARSER_STATE.QUOTE)
    this.set(STRING_PARSER_STATE.SPECIAL, '\\', STRING_PARSER_STATE.SPECIAL_BSLASH)

    // Special Bslash always skip back to regular after the char.
    this.range(STRING_PARSER_STATE.SPECIAL_BSLASH, 0, 0xFF, STRING_PARSER_STATE.REGULAR)
    /* eslint-enable no-magic-numbers */
  }

  public extract = (
      input: Uint8Array,
      cursor: number,
      endCursor: number,
      codePage: number = 0): string | undefined => {

    // eslint-disable-next-line no-magic-numbers -- 2 is a minimum length.
    if ((endCursor - cursor) < 2) {
      return
    }

    if (input[cursor] !== QUOTE) {
      return
    }

    ++cursor

    let result: string = ''

    let reificationIndex = cursor

    while (cursor < endCursor) {
      const currentByte = input[cursor]

      switch (currentByte) {
        case QUOTE:
          {
            const nextCursor = cursor + 1

            if (nextCursor < endCursor && input[nextCursor] === QUOTE) {
              result ??= ''

              if (cursor > reificationIndex) {
                result += decoder.decode(input.subarray(reificationIndex, cursor - 1))
              }

              result += '\''
              cursor = nextCursor + 1

              reificationIndex = cursor
            } else {
              result ??= ''

              result += decoder.decode(input.subarray(reificationIndex, cursor))

              return result
            }
          }
          break

        case BSLASH:
        {
          const nextCursor = cursor + 1

          if (nextCursor >= endCursor) {
            return result
          }

          const nextChar = input[nextCursor]

          switch (nextChar) {
            case BSLASH:

              result ??= ''
              result += '\\'
              cursor = nextCursor + 1

              reificationIndex = cursor
              break

            case P: {
              const nextCursor2 = nextCursor + 1

              if (nextCursor2 >= endCursor) {
                return result
              }

              const nextChar2 = input[nextCursor2]

              if (nextChar2 !== BSLASH) {
                result ??= ''
                result += decoder.decode(input.subarray(reificationIndex, cursor))
                cursor = nextCursor2 + 1
                break
              }

              const nextCursor3 = nextCursor2 + 1

              if (nextCursor3 >= endCursor) {
                return result
              }

              const nextChar3 = input[nextCursor3]

              if (nextChar3 < A || nextChar3 > I) {
                return result
              }

              result ??= ''
              result += decoder.decode(input.subarray(reificationIndex, cursor))

              codePage = nextChar3 - A

              cursor = nextCursor3 + 1
              reificationIndex = cursor
              break
            }
            case S: {
              const nextCursor2 = nextCursor + 1

              if (nextCursor2 >= endCursor) {
                return result
              }

              const nextChar2 = input[nextCursor2]

              if (nextChar2 !== BSLASH) {
                result ??= ''
                result += decoder.decode(input.subarray(reificationIndex, cursor))
                cursor = nextCursor2 + 1
                break
              }

              const nextCursor3 = nextCursor2 + 1

              if (nextCursor3 >= endCursor) {
                return result
              }

              const nextChar3 = input[nextCursor3]

              result ??= ''
              result += decoder.decode(input.subarray(reificationIndex, cursor))

              /* eslint-disable no-magic-numbers */
              if (nextChar3 < 0x7F) {
                result += String.fromCharCode(nextChar3)
              } else
              if (nextChar >= 0xA1 && nextChar <= 0xFF) {
                result += ISO8859Table[codePage][nextChar - 0xA1]
              } else {
                return result
              }
              /* eslint-enable no-magic-numbers */

              cursor = nextCursor3 + 1
              reificationIndex = cursor
              break
            }
            case X: {
              const nextCursor2 = nextCursor + 1

              if (nextCursor2 >= endCursor) {
                return result
              }

              const nextChar2 = input[nextCursor2]

              result ??= ''
              result += decoder.decode(input.subarray(reificationIndex, cursor))

              // eslint-disable-next-line no-loop-func
              const hexParserTil0 = (count: number) => {

                if (nextCursor2 + 1 >= endCursor || input[nextCursor2 + 1] !== BSLASH) {
                  return false
                }

                // Parsing offsets
                /* eslint-disable no-magic-numbers */
                let intermediateCursor = nextCursor2 + 2
                let characterCode = 0

                while (intermediateCursor + 1 < endCursor && count >= 0) {
                  if (input[intermediateCursor] === BSLASH) {
                    if (
                      count !== 0 ||
                      intermediateCursor + 3 >= endCursor ||
                      input[intermediateCursor + 1] !== X ||
                      input[intermediateCursor + 2] !== ZERO ||
                      input[intermediateCursor + 3] !== BSLASH) {
                      return false
                    }

                    let codePoint: string

                    try {
                      codePoint = String.fromCodePoint(characterCode)
                    } catch (_) {
                      codePoint = '<invalid codepoint>'
                    }

                    result += codePoint

                    cursor = intermediateCursor + 4
                    reificationIndex = cursor

                    return true
                  }

                  const hex0 = readHex(input[intermediateCursor])
                  const hex1 = readHex(input[intermediateCursor + 1])

                  if (hex0 === void 0 || hex1 === void 0) {
                    return false
                  }

                  characterCode <<= 8
                  characterCode |= (hex0 << 4) | hex1

                  intermediateCursor += 2

                  --count

                  /* eslint-enable no-magic-numbers */
                }

                return false
              }

              switch (nextChar2) {
                case BSLASH: {

                  /* eslint-disable no-magic-numbers */
                  if (nextCursor2 + 2 >= endCursor) {
                    return result
                  }

                  const hex0 = readHex(input[nextCursor2 + 1])
                  const hex1 = readHex(input[nextCursor2 + 2])

                  if (hex0 === void 0 || hex1 === void 0) {
                    return result
                  }

                  const characterCode = (hex0 << 4) | hex1
                  let codePoint: string

                  try {
                    codePoint = String.fromCodePoint(characterCode)
                  } catch (_) {
                    codePoint = '<invalid codepoint>'
                  }

                  result += codePoint

                  cursor = nextCursor2 + 3
                  reificationIndex = cursor
                  /* eslint-disable no-magic-numbers */
                }

                  break

                case TWO:


                  if (!hexParserTil0(2)) {
                    return `${result}<invalid unicode>`
                  }

                  break

                case FOUR:


                  if (!hexParserTil0(4)) {
                    return `${result}<invalid unicode>`
                  }
                  break

                default:

                  return result
              }

              break
            }

            default:

              break
          }

          break
        }

        default:

          ++cursor
          break
      }
    }
  }

  /**
   * Match a STEP string
   *
   * @param input The input buffer.
   * @param cursor The offset in the input buffer where the string may be.
   * @param endCursor The end point of the parse which should not be overflowed.
   * @return {number | undefined} The matching string value or undefined if none matches
   * or the parse fails.
   */
  public match = (input: Uint8Array, cursor: number, endCursor: number): number | undefined => {
    if ((endCursor - cursor) < 2) {
      return
    }

    if (input[cursor] !== QUOTE) {
      return
    }

    return super.match(
        input,
        STRING_PARSER_TERMINUS_FLAGS,
        cursor + 1,
        endCursor,
        STRING_PARSER_STATE.REGULAR)
  }

  public static readonly Instance = new StepStringParser()
}
