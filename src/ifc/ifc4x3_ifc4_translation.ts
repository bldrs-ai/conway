/**
 * The IFC4X3-only entity keywords an IFC4 parse of an IFC4X3 file may
 * translate to an IFC4 type, and how much of each translated record may be
 * decoded as that IFC4 type. Consumed by `ifc4x3_ifc4_compat.ts` (the
 * eligibility gate and the private index build) and by
 * `ifc4x3_decode_compat_derive.ts` (which re-checks every entry below
 * against the two EXPRESS schemas — see `translationChecks` there, asserted
 * clean by ifc4x3_decode_compat_derive.test.ts).
 *
 * WHAT A NEW ENTRY MUST SATISFY, and why:
 *
 * 1. `target` is a CONCRETE IFC4 entity. The IFC4 model constructs records
 *    from `schema.constructors[typeID]`, which is `undefined` for abstract
 *    types — an abstract target would silently drop every translated record.
 *
 * 2. Attributes [0, `decodedPrefix`) of the IFC4X3 source and the IFC4
 *    target are decode-compatible position by position, under the same rule
 *    the shared-keyword compatibility set uses (ifc4x3_decode_compat_derive.ts).
 *    Only this prefix is ever decoded as the target type.
 *
 * 3. Every target attribute at index >= `decodedPrefix` is OPTIONAL in IFC4.
 *    Those positions are MASKED: the typed getters read them as `$`
 *    (StepModelBase.setFieldMasks / StepEntityBase.getOffsetAndEndCursor),
 *    and the compat surface's `getRawLineData` truncates the raw arguments
 *    to the prefix and pads them with `null` up to `targetExplicitCount`.
 *    `$` is only a legal value for an OPTIONAL attribute, so masking a
 *    required one would present an invalid IFC4 record rather than an
 *    absent value.
 *
 * 4. `targetExplicitCount` is the IFC4 target's explicit-attribute count
 *    (inverses excluded). It sizes the null padding above, so web-ifc's
 *    positional `FromTape` sees exactly the target's layout.
 *
 * Why the mask and not a "longest safe prefix" alone: the tail is where the
 * hazard is. IFC4X3 RC2's IfcFacilityPart carries
 * `IFCROADPARTTYPEENUM(.ROADSEGMENT.)` (a typed select) at index 9, which is
 * IFC4 IfcBuildingStorey's `Elevation` (an IfcLengthMeasure REAL). Decoded
 * unmasked, the storey getter would return null-on-error or throw, and
 * web-ifc's `FromTape` would put the select object into `Elevation`. That
 * mis-typing is how the rejected alias approach corrupted properties.
 *
 * RC2 vs ADD2: files in the wild declare IFC4X3_RC2 (KIT-Simple-Road does),
 * but conway generates, and this table is checked, against IFC4X3_ADD2.
 * The two disagree in the TAILS of these very entities: RC2 IfcRoad has 9
 * attributes and ADD2 adds PredefinedType at index 9; RC2 IfcFacilityPart
 * has 11 (…, CompositionType, then a typed-select PredefinedType such as
 * `IFCROADPARTTYPEENUM(.ROADSEGMENT.)`, then a facility-usage enum such as
 * `.LONGITUDINAL.`), while ADD2 IfcFacilityPart is abstract with 10, index 9
 * being UsageType. The shared prefixes below (IfcSpatialStructureElement's
 * 9 for the spatial pair, IfcElement's 8 for the element pair) are identical
 * in RC2, ADD2 and IFC4. So translation is sound on the prefix, and the
 * mask is exactly what makes the RC2/ADD2 tail differences irrelevant.
 * Phase 2b (generic 4x3 extraction, bldrs-ai/conway#280) should note that
 * the ADD2 module itself mis-decodes an RC2 IfcFacilityPart's index 9.
 *
 * NavTree/properties show the IFC4 target class name (a kerb shows as
 * IfcBuildingElementProxy). That is a documented limitation: carrying the
 * IFC4X3 name through web-ifc's numeric type codes is not contained.
 */
export interface Ifc4x3Translation {

  /** The IFC4 entity name (upper case, as a STEP keyword) decoded as. */
  readonly target: string

  /** Number of leading attributes decoded as `target`; the rest are masked. */
  readonly decodedPrefix: number

  /** IFC4 `target`'s explicit-attribute count (see rule 4 above). */
  readonly targetExplicitCount: number
}


export const IFC4X3_TO_IFC4_TRANSLATIONS: Readonly<Record<string, Ifc4x3Translation>> = {

  // Spatial pair: aggregation (IfcRelAggregates) and containment
  // (IfcRelContainedInSpatialStructure) must resolve to IFC4 spatial
  // structure elements for the spatial tree to build. Prefix 9 is
  // IfcSpatialStructureElement's layout, ending at CompositionType. IFC4
  // IfcBuilding's tail (ElevationOfRefHeight, ElevationOfTerrain,
  // BuildingAddress) and IfcBuildingStorey's (Elevation) are all OPTIONAL,
  // so they read as absent.
  IFCROAD: { target: 'IFCBUILDING', decodedPrefix: 9, targetExplicitCount: 12 },
  IFCFACILITYPART: { target: 'IFCBUILDINGSTOREY', decodedPrefix: 9, targetExplicitCount: 10 },

  // Element pair: IfcElement's 8 attributes, ending at Tag. Index 8 is
  // PredefinedType on both sides, but of different enums
  // (IfcPavementTypeEnum / IfcKerbTypeEnum vs
  // IfcBuildingElementProxyTypeEnum). A value such as `.FLEXIBLE.` has no
  // proxy counterpart, and IFC4's decoder would silently turn it into null
  // (nullOnErrors) or throw (strict). So index 8 is masked: PredefinedType
  // always reads as absent, whatever the file says, including a value that
  // happens to share a name (`.NOTDEFINED.`).
  IFCPAVEMENT: { target: 'IFCBUILDINGELEMENTPROXY', decodedPrefix: 8, targetExplicitCount: 9 },
  IFCKERB: { target: 'IFCBUILDINGELEMENTPROXY', decodedPrefix: 8, targetExplicitCount: 9 },
}


/**
 * IFC4 entity keywords that do not exist in IFC4X3 ADD2 but may still
 * appear in an eligible IFC4X3 file. There is no ADD2 layout to compare
 * against, so each entry is a deliberate decision, never a blanket
 * allowance. Anything IFC4-only that is not listed here refuses the file.
 *
 * - IFCPRESENTATIONSTYLEASSIGNMENT: an IFC4 type (deprecated there, removed
 *   in ADD2) that exporters still write with IFC4's own layout (a single
 *   `Styles` set) as the IfcStyledItem.Styles indirection. KIT-Simple-Road
 *   routes all 66 of its surface styles through it. Decoding it with IFC4's
 *   definition is exactly how it was written.
 */
export const IFC4_ONLY_KEYWORDS_ALLOWED_IN_IFC4X3: ReadonlySet<string> = new Set( [
  'IFCPRESENTATIONSTYLEASSIGNMENT',
] )
