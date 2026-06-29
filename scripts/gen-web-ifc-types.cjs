/* eslint-disable */
// Regenerate the vendored web-ifc compat constant tables from the installed
// `web-ifc` devDependency:
//
//   src/compat/web-ifc/ifc2x4.ts   — IFCxxx name->typecode consts + IfcElements
//   src/compat/web-ifc/types-map.ts — IfcTypesMap (code->name) + IfcElements obj
//
// Conway owns these tables so the shipped package never depends on web-ifc at
// runtime (the conway-web-ifc-adapter removal). Generating them — rather than
// hand-vendoring — makes stepping web-ifc forward mechanical: bump the
// `web-ifc` devDependency, run `yarn gen-web-ifc-types`, and the
// web_ifc_parity test proves the result is faithful to upstream.
//
//   yarn gen-web-ifc-types
//
// Set WEB_IFC_ENTRY to a web-ifc package main (e.g. a yarn cache copy) to
// generate without a local install.
//
// Sources, all from one pinned web-ifc:
//   - IFCxxx consts + IfcElements array: public exports of the package root.
//   - IfcTypesMap: the inverse of the IFCxxx consts (code -> name).
//   - IfcElements object: web-ifc's properties-helper map, which is NOT a
//     public export, so it is read out of the bundle source (the `IfcElements2`
//     object literal). If a future web-ifc reshapes that bundle this throws —
//     update the extraction here when it does.
const fs = require('fs')
const path = require('path')

const entry = process.env.WEB_IFC_ENTRY || require.resolve('web-ifc')
const webIfc = require(entry)
const version = require(path.join(path.dirname(entry), 'package.json')).version

const outDir = path.resolve(__dirname, '../src/compat/web-ifc')

const banner =
  `/* Generated from web-ifc@${version} by scripts/gen-web-ifc-types.cjs.\n` +
  `   Do not edit by hand — run \`yarn gen-web-ifc-types\` to refresh. */\n`

// Public IFCxxx name -> typecode constants, sorted by name.
const constants = Object.entries(webIfc)
    .filter(([name, value]) => name.startsWith('IFC') && typeof value === 'number')
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))

if (constants.length === 0) {
  throw new Error(`No IFCxxx constants found on web-ifc entry ${entry}`)
}

const codeToName = new Map(constants.map(([name, code]) => [code, name]))

// Public IfcElements array (geometric element typecodes), upstream order.
const ifcElementsArray = webIfc.IfcElements
if (!Array.isArray(ifcElementsArray)) {
  throw new Error('web-ifc.IfcElements is not an array')
}

// Internal properties-helper IfcElements object (code -> name), read from the
// bundle source since web-ifc does not export it.
function extractIfcElementsObject() {
  const source = fs.readFileSync(entry, 'utf8')
  const marker = source.indexOf('IfcElements2 = {')
  if (marker < 0) {
    throw new Error(
        'Could not locate the internal IfcElements object literal ' +
        '(IfcElements2) in the web-ifc bundle. The bundle layout changed — ' +
        'update extractIfcElementsObject() in scripts/gen-web-ifc-types.cjs.')
  }
  const open = source.indexOf('{', marker)
  // The literal is a flat `{ <digits>: "<name>", ... }` — keys are numeric and
  // values are IFCxxx identifiers, so neither contains a brace. The first `}`
  // after the open brace is therefore the object terminator, regardless of
  // whether it's immediately followed by `;`.
  const close = source.indexOf('}', open + 1)
  const obj = {}
  for (const m of source.slice(open, close + 1).matchAll(/(\d+):\s*"(IFC\w+)"/g)) {
    obj[Number(m[1])] = m[2]
  }
  if (Object.keys(obj).length === 0) {
    throw new Error('Extracted an empty IfcElements object from the bundle')
  }
  return obj
}

const ifcElementsObject = extractIfcElementsObject()
const sortNumeric = (entries) => entries.sort(([a], [b]) => Number(a) - Number(b))

// ---- ifc2x4.ts ------------------------------------------------------------
let ifc2x4 = banner
for (const [name, code] of constants) {
  ifc2x4 += `export const ${name} = ${code}\n`
}
ifc2x4 += '\nexport const IfcElements = [\n'
for (const code of ifcElementsArray) {
  // Reference the named constant when we have one, else the raw code.
  ifc2x4 += `  ${codeToName.get(code) || code},\n`
}
ifc2x4 += ']\n'

// ---- types-map.ts ---------------------------------------------------------
let typesMap = banner
typesMap += 'export const IfcTypesMap: { [key: number]: string } = {\n'
for (const [code, name] of sortNumeric(constants.map(([n, c]) => [c, n]))) {
  typesMap += `  ${code}: '${name}',\n`
}
typesMap += '}\n\nexport const IfcElements: { [key: number]: string } = {\n'
for (const [code, name] of sortNumeric(Object.entries(ifcElementsObject))) {
  typesMap += `  ${code}: '${name}',\n`
}
typesMap += '}\n'

fs.writeFileSync(path.join(outDir, 'ifc2x4.ts'), ifc2x4)
fs.writeFileSync(path.join(outDir, 'types-map.ts'), typesMap)

console.log(
    `Generated from web-ifc@${version}: ${constants.length} constants, ` +
    `${ifcElementsArray.length}-entry IfcElements array, ` +
    `${Object.keys(ifcElementsObject).length}-entry IfcElements object.`)
