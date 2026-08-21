/**
 * RFC 4180 CSV field quoting and parsing.
 *
 * The perf CSVs (`performance-detail.csv` and the delta CSVs derived from it)
 * carry free text lifted straight out of an IFC/STEP FILE_NAME header —
 * `preprocessorVersion` and `originatingSystem`. Those fields routinely
 * contain commas (`Trimble Nova (Build = 16.2.0.15, Compile = Sep 23 2021)`),
 * and nothing stops them containing double quotes or newlines either. Emitted
 * raw they split the row into extra columns, which is how five committed rows
 * in test-models/test-models-private ended up with 16 columns against a
 * 15-column header and GitHub's CSV viewer refused to render the file.
 *
 * Writer and reader live in one module on purpose: quoting the output without
 * teaching the reader to honour quotes just moves the corruption downstream
 * into gen_delta_csv.cjs, which joins two of these files on `filename`.
 */

/**
 * Quote one field per RFC 4180: wrap in double quotes if it contains a comma,
 * a double quote, CR or LF, and double any embedded quote.
 *
 * Applied to EVERY field by csvRow rather than to the fields known to be
 * risky today — the next free-text column added to these CSVs should not be a
 * new instance of this bug.
 *
 * @param {*} value Field value; null/undefined become the empty field.
 * @return {string} The field, quoted if it needs to be.
 */
function csvField(value) {
  const text = (value === null || value === undefined) ? '' : String(value)

  if (!/[",\r\n]/.test(text)) {
    return text
  }

  return `"${text.replace(/"/g, '""')}"`
}

/**
 * Join fields into one RFC 4180 record (no trailing newline).
 *
 * @param {Array<*>} fields Field values in column order.
 * @return {string} The encoded row.
 */
function csvRow(fields) {
  return fields.map(csvField).join(',')
}

/**
 * Parse RFC 4180 CSV text into an array of records, each an array of fields.
 *
 * Handles quoted fields containing commas, doubled quotes and embedded
 * newlines, and both LF and CRLF line endings. Blank records (a line with no
 * content at all) are dropped — the perf CSVs end with a trailing newline and
 * a phantom empty row would otherwise join as a row keyed on the empty
 * filename.
 *
 * @param {string} text Whole CSV file contents.
 * @return {Array<Array<string>>} Records in file order.
 */
function parseCsv(text) {
  const records = []
  let record = []
  let field = ''
  let inQuotes = false
  let fieldWasQuoted = false

  /** Close the current field and push it onto the current record. */
  const endField = () => {
    record.push(field)
    field = ''
    fieldWasQuoted = false
  }

  /**
   * Close the current record. A record of one empty, unquoted field is a
   * blank line, not data — drop it.
   */
  const endRecord = () => {
    endField()
    if (!(record.length === 1 && record[0] === '')) {
      records.push(record)
    }
    record = []
  }

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"' && field === '' && !fieldWasQuoted) {
      inQuotes = true
      fieldWasQuoted = true
    } else if (char === ',') {
      endField()
    } else if (char === '\n') {
      endRecord()
    } else if (char === '\r') {
      // CRLF: the LF closes the record. A lone CR is treated the same way.
      if (text[i + 1] === '\n') {
        i++
      }
      endRecord()
    } else {
      field += char
    }
  }

  // A file not ending in a newline still has a final record to flush.
  if (field !== '' || record.length > 0) {
    endRecord()
  }

  return records
}

module.exports = { csvField, csvRow, parseCsv }
