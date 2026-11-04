#!/usr/bin/env node
/**
 * Raw line parse parity: did a change to StepParser.extractArguments change
 * any record it should not have?
 *
 * The raw parse is what `getLine` / `GetRawLineData` and every
 * `properties.*` read return; geometry reads through the generated entities
 * and never sees it, so the regression digests cannot catch a change here.
 * This dumps every record's raw arguments with one build, again with
 * another, and diffs the two, sorting each changed record by the inline-
 * element shapes in its text:
 *
 *   a  an inline element (typed value written in place) inside a list,
 *      e.g. `(IFCLABEL('a'),IFCLABEL('b'))`
 *   b  a list inside an inline element,
 *      e.g. `IFCPROPERTYSETDEFINITIONSET((#20,#21))`
 *
 * Usage, from the conway root, with a build of each side in turn:
 *
 *   node scripts/raw_line_parity.mjs dump before.json data/*.ifc data/*.step …
 *   # rebuild with the change
 *   node scripts/raw_line_parity.mjs dump after.json  data/*.ifc data/*.step …
 *   node scripts/raw_line_parity.mjs diff before.json after.json [--shapes ab]
 *
 * `--shapes` names the shapes the change is meant to touch (default `ab`,
 * conway#763's). The diff prints every changed record with none of them as
 * UNEXPECTED, and exits 1 if there is one. Records with an expected shape
 * that did not change are listed as FLAGGED-SAME; a record the raw path
 * cannot parse on either side (no entity for its keyword, or a parse
 * failure, which reads as empty arguments) lands there. That list is how a
 * vacuous run shows itself, so read it rather than only the exit code.
 *
 * Big models want `node --max-old-space-size=8192`; the dump holds every
 * record of every file in memory.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'


const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const RECORD = /^\s*#(\d+)\s*=\s*([A-Za-z0-9_]*)\s*\(/gm


/**
 * Each record's keyword and inline-element shapes, from the file text.
 *
 * A paren after an identifier opens an inline element; any other paren opens
 * a list. The record's own paren is neither. Strings are skipped whole.
 * Complex (multi-mapping) records, `#1=(A()B())`, have no keyword and are not
 * classified, so a change to one is reported as UNEXPECTED.
 *
 * @param {string} text The file.
 * @return {Map<number, {keyword: string, a: boolean, b: boolean}>} By express ID.
 */
function recordShapes(text) {
  const out = new Map()
  let match
  RECORD.lastIndex = 0
  while ((match = RECORD.exec(text)) !== null) {
    const stack = ['record']
    let a = false
    let b = false
    let ident = ''
    let i = RECORD.lastIndex
    while (i < text.length && stack.length > 0) {
      const c = text[i]
      if (c === '\'') {
        for (++i; i < text.length; ++i) {
          if (text[i] === '\'' && text[i + 1] === '\'') {
            ++i
          } else if (text[i] === '\'') {
            break
          }
        }
        ++i
        ident = ''
        continue
      }
      if (/[A-Za-z0-9_]/.test(c)) {
        ident += c
        ++i
        continue
      }
      if (c === '(') {
        const kind = /^[A-Za-z]/.test(ident) ? 'inline' : 'list'
        const top = stack[stack.length - 1]
        a ||= kind === 'inline' && top === 'list'
        b ||= kind === 'list' && top === 'inline'
        stack.push(kind)
      } else if (c === ')') {
        stack.pop()
      }
      if (!/\s/.test(c)) {
        ident = ''
      }
      ++i
    }
    out.set(Number(match[1]), { keyword: match[2], a, b })
  }
  return out
}


/**
 * Dump `GetRawLineData(id).arguments` for every record of each file.
 *
 * @param {string} out The JSON file to write.
 * @param {string[]} files IFC or STEP files.
 */
async function dump(out, files) {
  const { IfcAPI } = await import(
      pathToFileURL(path.join(ROOT, 'compiled/src/compat/web-ifc/ifc_api.js')).href)
  const api = new IfcAPI()
  await api.Init()
  const result = {}
  for (const file of files) {
    const buffer = new Uint8Array(fs.readFileSync(file))
    let modelID
    try {
      modelID = api.OpenModel(buffer, {})
    } catch (e) {
      result[file] = { error: String(e) }
      continue
    }
    if (modelID === -1 || api.getPassthrough(modelID) === undefined) {
      result[file] = { error: 'not opened' }
      continue
    }
    const lines = {}
    for (const id of recordShapes(new TextDecoder().decode(buffer)).keys()) {
      try {
        const raw = api.GetRawLineData(modelID, id)
        lines[id] = raw.type === -1 ? null : raw.arguments
      } catch (e) {
        lines[id] = { error: String(e) }
      }
    }
    result[file] = lines
    api.CloseModel(modelID)
  }
  fs.writeFileSync(out, JSON.stringify(result))
  console.log(`dumped ${Object.keys(result).length} files to ${out}`)
}


/**
 * Diff two dumps and classify every changed record.
 *
 * @param {string} beforePath The dump from the base build.
 * @param {string} afterPath The dump from the changed build.
 * @param {string} shapes The shapes the change is meant to touch.
 * @return {number} The exit code.
 */
function diff(beforePath, afterPath, shapes) {
  const before = JSON.parse(fs.readFileSync(beforePath, 'utf8'))
  const after = JSON.parse(fs.readFileSync(afterPath, 'utf8'))
  const totals = { files: 0, records: 0, changed: 0, unexpected: 0, flaggedSame: 0 }
  const byKeyword = new Map()

  for (const file of Object.keys(before)) {
    const was = before[file]
    const now = after[file]
    if (was.error !== undefined || now === undefined || now.error !== undefined) {
      console.log(`SKIP ${file}: ${was.error ?? now?.error ?? 'absent from the second dump'}`)
      continue
    }
    ++totals.files
    const recordsShapes = recordShapes(fs.readFileSync(file, 'latin1'))
    let changedHere = 0
    for (const id of Object.keys(was)) {
      ++totals.records
      const shape = recordsShapes.get(Number(id)) ?? { keyword: '?', a: false, b: false }
      const flags = (shape.a ? 'a' : '') + (shape.b ? 'b' : '')
      const expected = [...flags].some((flag) => shapes.includes(flag))
      const same = JSON.stringify(was[id]) === JSON.stringify(now[id])
      if (!same) {
        ++totals.changed
        ++changedHere
        const key = `${shape.keyword} [${flags || '-'}]`
        byKeyword.set(key, (byKeyword.get(key) ?? 0) + 1)
        if (!expected) {
          ++totals.unexpected
          console.log(`UNEXPECTED ${file} #${id} ${shape.keyword}\n  ` +
            `${JSON.stringify(was[id]).slice(0, 300)}\n  => ${JSON.stringify(now[id]).slice(0, 300)}`)
        }
      } else if (expected) {
        ++totals.flaggedSame
        console.log(`FLAGGED-SAME ${file} #${id} ${shape.keyword} ${JSON.stringify(now[id]).slice(0, 200)}`)
      }
    }
    console.log(`${file}: ${Object.keys(was).length} records, ${changedHere} changed`)
  }
  console.log(totals)
  console.log('changed, by keyword [shape]:', Object.fromEntries(byKeyword))
  return totals.unexpected > 0 ? 1 : 0
}


const [mode, ...rest] = process.argv.slice(2)

if (mode === 'dump' && rest.length >= 2) {
  await dump(rest[0], rest.slice(1))
} else if (mode === 'diff' && rest.length >= 2) {
  const at = rest.indexOf('--shapes')
  process.exitCode = diff(rest[0], rest[1], at >= 0 ? rest[at + 1] : 'ab')
} else {
  console.error('usage: raw_line_parity.mjs dump <out.json> <file>... | ' +
    'diff <before.json> <after.json> [--shapes ab]')
  process.exitCode = 2
}
