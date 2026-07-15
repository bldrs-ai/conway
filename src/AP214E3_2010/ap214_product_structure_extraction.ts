import AP214StepModel from './ap214_step_model'
import { AP214ProductShapeMap } from './ap214_product_shape_map'
import { face_based_surface_model } from './AP214E3_2010_gen/face_based_surface_model.gen'
import { manifold_solid_brep } from './AP214E3_2010_gen/manifold_solid_brep.gen'
import { next_assembly_usage_occurrence } from './AP214E3_2010_gen/next_assembly_usage_occurrence.gen'
import { product_definition } from './AP214E3_2010_gen/product_definition.gen'
import { product_definition_shape } from './AP214E3_2010_gen/product_definition_shape.gen'
import { representation } from './AP214E3_2010_gen/representation.gen'
import { representation_item } from './AP214E3_2010_gen/representation_item.gen'
import {
  representation_relationship_with_transformation,
} from './AP214E3_2010_gen/representation_relationship_with_transformation.gen'
import { shape_definition_representation } from './AP214E3_2010_gen/shape_definition_representation.gen'
import {
  shape_representation_relationship,
} from './AP214E3_2010_gen/shape_representation_relationship.gen'
import { shell_based_surface_model } from './AP214E3_2010_gen/shell_based_surface_model.gen'


/**
 * A node in the extracted STEP product / assembly structure.
 *
 * The structure is *occurrence*-keyed, not product-keyed: STEP instancing lets
 * one `product_definition` (a part *type*) appear many times in an assembly via
 * distinct `next_assembly_usage_occurrence` (NAUO) edges. A scalar express id of
 * the product cannot tell two visual instances apart, so each occurrence node
 * carries both its NAUO express id (`expressID`) and the ordered
 * `occurrencePath` (root→node, NAUO ids) that is the stable
 * selection / permalink token. See
 * `design/new/step-metadata-nist.md` §"Occurrence identity".
 *
 * This is the forcing function for Share's goal of generalizing its scalar
 * `expressID` selection key into a format-agnostic *occurrence path* — flag it
 * wherever this tree is consumed Share-side.
 */
export interface ProductStructureNode {

  /**
   * Node selection key. For an occurrence node this is the NAUO express id; for
   * a root (single-part files have no NAUO) it falls back to the
   * `product_definition` express id.
   */
  expressID: number

  /**
   * Readable node kind: `'product'` for roots, `'product_occurrence'` for NAUO
   * nodes, `'solid'` for ephemeral sub-product solid nodes.
   */
  type: string

  /** Display label: `product.name`, falling back to the NAUO name / reference designator. */
  name: string

  /** Express id of the underlying `product_definition` (the part *type*). */
  productDefinitionExpressID: number

  /** NAUO express id for occurrence nodes; `undefined` for roots. */
  occurrenceExpressID?: number

  /**
   * Ordered occurrence path (NAUO express ids) from the top-level occurrence to
   * this node. Empty for roots. Disambiguates instances of the same part — e.g.
   * `[3810, 1921, 1910]` vs `[6217, 1921, 1910]` for the two bolts in `as1`.
   */
  occurrencePath: number[]

  /**
   * Shape representation express ids linked to this part (via
   * `product_definition_shape` → `shape_definition_representation`). The seam to
   * scene geometry for NavTree-click ⇄ viewport-pick round-tripping.
   */
  shapeRepresentationIds: number[]

  /** Child occurrence nodes (and, when opted in, ephemeral solid nodes). */
  children: ProductStructureNode[]

  /**
   * True for ephemeral (non-product) nodes — pickable geometry that carries
   * identity in the file but has no product semantics, e.g. one named solid of
   * a multibody part. Consumers should render these lighter-weight,
   * selectable-but-not-product. See `design/new/step-nonproduct-semantics.md`.
   */
  ephemeral?: boolean

  /**
   * Number of this node's solids suppressed by the ephemeral-layer limits
   * (unnamed-soup suppression or the per-product cap), so a consumer can
   * render an "N more…" affordance instead of silently truncating.
   */
  droppedSolids?: number
}

/**
 * Options for {@link AP214ProductStructureExtraction.extractProductStructure}.
 */
export interface ProductStructureOptions {

  /**
   * Surface an ephemeral layer of solid-level nodes beneath each multibody
   * product (default false). A product only gets solid children when its shape
   * representation holds at least two solids — a single-solid product already
   * maps 1:1 onto its node — and an all-unnamed set larger than
   * {@link maxUnnamedSolidsPerProduct} is suppressed as meaningless "solid
   * soup" (the DSA2 case: 28k unnamed single-face shells under one product).
   */
  includeSolids?: boolean

  /**
   * Hard cap on emitted solid children per product occurrence
   * (default {@link DEFAULT_MAX_SOLIDS_PER_PRODUCT}); overflow is reported via
   * {@link ProductStructureNode.droppedSolids}.
   */
  maxSolidsPerProduct?: number

  /**
   * When a product's solids are *all* unnamed and outnumber this (default
   * {@link DEFAULT_MAX_UNNAMED_SOLIDS_PER_PRODUCT}), emit none of them:
   * large anonymous solid dumps (ECAD merged-component products, tessellated
   * surface soup) carry no navigable semantics. Named solids are never
   * suppressed by this limit.
   */
  maxUnnamedSolidsPerProduct?: number
}

/** Default hard cap on emitted solid children per product occurrence. */
export const DEFAULT_MAX_SOLIDS_PER_PRODUCT = 256

/** Default suppression threshold for a product whose solids are all unnamed. */
export const DEFAULT_MAX_UNNAMED_SOLIDS_PER_PRODUCT = 32

/** Minimum solids in a product before the ephemeral layer adds anything. */
const MIN_SOLIDS_FOR_EPHEMERAL = 2

/** Readable node-kind strings for {@link ProductStructureNode.type}. */
const ROOT_NODE_TYPE = 'product'
const OCCURRENCE_NODE_TYPE = 'product_occurrence'
const SOLID_NODE_TYPE = 'solid'

/** A solid found in a product's shape representation, for ephemeral nodes. */
interface ProductSolid {

  /** The solid's express id — the ephemeral node's selection key. */
  expressID: number

  /** The solid's own name (SolidWorks/CATIA body names), possibly empty. */
  name: string

  /** Express id of the representation the solid was found in. */
  representationId: number
}

/**
 * Whether a representation-item name carries meaning (non-empty and not an
 * exporter placeholder).
 *
 * @param name The item name.
 * @return {boolean} True when the name is worth displaying.
 */
function isMeaningfulName( name: string ): boolean {
  return name.length > 0 && name !== 'NONE' && name !== 'UNKNOWN'
}

/**
 * Whether a representation item is a solid-level body that can anchor an
 * ephemeral node ({@link manifold_solid_brep} covers its `brep_with_voids` /
 * `faceted_brep` subtypes).
 *
 * @param item The representation item.
 * @return {boolean} True for solid-level items.
 */
function isSolidItem( item: representation_item ): boolean {
  return item instanceof manifold_solid_brep ||
    item instanceof shell_based_surface_model ||
    item instanceof face_based_surface_model
}

/**
 * Extracts the STEP product / assembly structure from a populated
 * {@link AP214StepModel} into a nested, named, occurrence-keyed tree.
 *
 * Mirrors the IFC precedent (`src/ifc/ifc_property_extraction.ts`) but for
 * AP214/AP242: walks `product` / `product_definition` /
 * `next_assembly_usage_occurrence` into a tree, resolves labels from
 * `product.name`, and links each part to its shape representations so a NavTree
 * node can highlight the right geometry instance.
 */
export class AP214ProductStructureExtraction {

  private readonly nauosByParent_ = new Map<number, next_assembly_usage_occurrence[]>()
  private readonly childProductDefIds_ = new Set<number>()
  private readonly productDefById_ = new Map<number, product_definition>()
  private readonly shapeRepsByProductDef_ = new Map<number, number[]>()
  private readonly solidsByProductDef_ = new Map<number, ProductSolid[]>()
  private includeSolids_ = false
  private maxSolidsPerProduct_ = DEFAULT_MAX_SOLIDS_PER_PRODUCT
  private maxUnnamedSolidsPerProduct_ = DEFAULT_MAX_UNNAMED_SOLIDS_PER_PRODUCT

  /**
   * @param model The populated AP214/AP242 step model to walk.
   * @param productShapeMap Optional product↔shape map populated during geometry
   * extraction. When provided its links are merged with the ones derived here so
   * the tree's `shapeRepresentationIds` agree with the scene; the map is empty
   * unless geometry extraction has run, so the entity-graph walk below is the
   * primary source.
   */
  constructor(
      private readonly model: AP214StepModel,
      private readonly productShapeMap?: AP214ProductShapeMap ) {
  }

  /**
   * Build the product-structure tree.
   *
   * @param options Optional {@link ProductStructureOptions}; pass
   * `{ includeSolids: true }` to add the ephemeral solid layer beneath
   * multibody products.
   * @return {ProductStructureNode[]} The roots of the assembly forest. A
   * single-part file yields one root; a multi-level assembly (e.g. `as1`) yields
   * one root whose descendants are the NAUO occurrences.
   */
  public extractProductStructure( options?: ProductStructureOptions ): ProductStructureNode[] {

    this.includeSolids_ = options?.includeSolids ?? false
    this.maxSolidsPerProduct_ =
      options?.maxSolidsPerProduct ?? DEFAULT_MAX_SOLIDS_PER_PRODUCT
    this.maxUnnamedSolidsPerProduct_ =
      options?.maxUnnamedSolidsPerProduct ?? DEFAULT_MAX_UNNAMED_SOLIDS_PER_PRODUCT

    this.indexProductDefinitions()
    this.indexAssemblyUsages()
    this.indexShapeRepresentations()

    if ( this.includeSolids_ ) {
      this.indexSolids()
    }

    const roots: ProductStructureNode[] = []

    for ( const [ productDefId, productDef ] of this.productDefById_ ) {

      if ( this.childProductDefIds_.has( productDefId ) ) {
        continue
      }

      // A genuine root is a part: it has geometry and/or sub-assembly children.
      // This excludes stray product_definitions referenced only by metadata.
      const hasChildren = this.nauosByParent_.has( productDefId )
      const hasShape = this.shapeRepsByProductDef_.has( productDefId )

      if ( !hasChildren && !hasShape ) {
        continue
      }

      roots.push( this.buildNode( productDef, undefined, [], new Set<number>() ) )
    }

    return roots
  }

  /**
   * Index every `product_definition` by express id for O(1) lookup during the
   * recursive walk.
   */
  private indexProductDefinitions(): void {

    for ( const element of this.model.types( product_definition ) ) {

      const productDef = element as product_definition
      const expressID = productDef.expressID

      if ( expressID !== void 0 ) {
        this.productDefById_.set( expressID, productDef )
      }
    }
  }

  /**
   * Index every NAUO by its parent (`relating_product_definition`) express id
   * and record which product definitions appear as a child
   * (`related_product_definition`) so roots can be identified.
   */
  private indexAssemblyUsages(): void {

    for ( const element of this.model.types( next_assembly_usage_occurrence ) ) {

      const nauo = element as next_assembly_usage_occurrence

      const parentId = nauo.relating_product_definition?.expressID
      const childId = nauo.related_product_definition?.expressID

      if ( parentId === void 0 || childId === void 0 ) {
        continue
      }

      this.childProductDefIds_.add( childId )

      let siblings = this.nauosByParent_.get( parentId )

      if ( siblings === void 0 ) {
        siblings = []
        this.nauosByParent_.set( parentId, siblings )
      }

      siblings.push( nauo )
    }
  }

  /**
   * Link product definitions to their shape representations by walking
   * `shape_definition_representation` → `product_definition_shape` →
   * `product_definition`, and merge any links already present in the
   * geometry-extraction product↔shape map.
   */
  private indexShapeRepresentations(): void {

    for ( const element of this.model.types( shape_definition_representation ) ) {

      const sdr = element as shape_definition_representation

      const productDefId = AP214ProductStructureExtraction.resolveProductDefinitionId( sdr.definition )

      if ( productDefId === void 0 ) {
        continue
      }

      // The shape id is the *used_representation* (the geometry), not the SDR's
      // own id — falling back to `sdr.expressID` would store a non-geometry id
      // that a pick-reconciliation consumer could not resolve to a scene mesh.
      const shapeId = sdr.used_representation?.expressID

      if ( shapeId !== void 0 ) {
        this.addShapeRepresentation( productDefId, shapeId )
      }
    }

    if ( this.productShapeMap === void 0 ) {
      return
    }

    for ( const [ productDefId, shapes ] of this.productShapeMap.productDefsToShapes() ) {
      for ( const shapeId of shapes ) {
        this.addShapeRepresentation( productDefId, shapeId )
      }
    }
  }

  /**
   * Index the solid-level bodies of each product definition for the ephemeral
   * layer: walk each `shape_definition_representation`'s representation, plus
   * any representation reachable over a *plain* `shape_representation_relationship`
   * (SolidWorks binds a part's multibody `advanced_brep_shape_representation`
   * to its SDR-bound representation that way — the NEMA motor pattern), and
   * collect the solid items. Transformation-bearing relationship variants are
   * assembly placements (parent rep ↔ child rep), so following them would leak
   * every child part's solids into its parent assembly; they are skipped.
   */
  private indexSolids(): void {

    const relatedRepsByRepId = new Map<number, representation[]>()

    const relate = ( fromId: number | undefined, to: representation ): void => {

      if ( fromId === void 0 ) {
        return
      }

      let related = relatedRepsByRepId.get( fromId )

      if ( related === void 0 ) {
        related = []
        relatedRepsByRepId.set( fromId, related )
      }

      related.push( to )
    }

    for ( const element of this.model.types( shape_representation_relationship ) ) {

      const srr = element as shape_representation_relationship

      if ( srr.findVariant( representation_relationship_with_transformation ) !== void 0 ) {
        continue
      }

      const rep1 = srr.rep_1
      const rep2 = srr.rep_2

      if ( rep1 === void 0 || rep2 === void 0 ) {
        continue
      }

      // The geometry-bearing representation may be on either side; bridge both
      // ways and let solid-item filtering pick out the bodies.
      relate( rep1.expressID, rep2 )
      relate( rep2.expressID, rep1 )
    }

    for ( const element of this.model.types( shape_definition_representation ) ) {

      const sdr = element as shape_definition_representation

      const productDefId = AP214ProductStructureExtraction.resolveProductDefinitionId( sdr.definition )
      const usedRep = sdr.used_representation

      if ( productDefId === void 0 || usedRep === void 0 ) {
        continue
      }

      const reps = [ usedRep, ...( relatedRepsByRepId.get( usedRep.expressID ?? -1 ) ?? [] ) ]

      for ( const rep of reps ) {
        for ( const item of rep.items ) {

          if ( !isSolidItem( item ) || item.expressID === void 0 ) {
            continue
          }

          this.addSolid( productDefId, {
            expressID: item.expressID,
            name: item.name,
            representationId: rep.expressID ?? -1,
          } )
        }
      }
    }
  }

  /**
   * Record a solid for a product definition, de-duplicating by the solid's
   * express id (a body can be reachable both directly and over a
   * representation relationship).
   *
   * @param productDefId The owning product definition express id.
   * @param solid The solid to record.
   */
  private addSolid( productDefId: number, solid: ProductSolid ): void {

    let solids = this.solidsByProductDef_.get( productDefId )

    if ( solids === void 0 ) {
      solids = []
      this.solidsByProductDef_.set( productDefId, solids )
    }

    if ( !solids.some( ( existing ) => existing.expressID === solid.expressID ) ) {
      solids.push( solid )
    }
  }

  /**
   * Record a shape-representation id for a product definition, de-duplicating.
   *
   * @param productDefId The product definition express id.
   * @param shapeId The shape representation express id to associate.
   */
  private addShapeRepresentation( productDefId: number, shapeId: number ): void {

    let shapes = this.shapeRepsByProductDef_.get( productDefId )

    if ( shapes === void 0 ) {
      shapes = []
      this.shapeRepsByProductDef_.set( productDefId, shapes )
    }

    if ( !shapes.includes( shapeId ) ) {
      shapes.push( shapeId )
    }
  }

  /**
   * Recursively build a tree node for one product-definition occurrence.
   *
   * @param productDef The product definition this node represents.
   * @param occurrence The NAUO edge that introduced this occurrence, or
   * `undefined` for a root.
   * @param parentPath The occurrence path of the parent node (NAUO ids).
   * @param onPath Product-definition ids currently on the recursion stack;
   * guards against a malformed cyclic assembly causing infinite recursion (a
   * legitimately re-used part in sibling branches is unaffected).
   * @return {ProductStructureNode} The built node, with children.
   */
  private buildNode(
      productDef: product_definition,
      occurrence: next_assembly_usage_occurrence | undefined,
      parentPath: number[],
      onPath: Set<number> ): ProductStructureNode {

    const productDefId = productDef.expressID!
    const label = this.resolveLabel( productDef, occurrence )

    const occurrenceExpressID = occurrence?.expressID
    const occurrencePath = occurrenceExpressID !== void 0 ?
      [ ...parentPath, occurrenceExpressID ] : [ ...parentPath ]

    const node: ProductStructureNode = {
      expressID: occurrenceExpressID ?? productDefId,
      type: occurrence !== void 0 ? OCCURRENCE_NODE_TYPE : ROOT_NODE_TYPE,
      name: label,
      productDefinitionExpressID: productDefId,
      occurrenceExpressID,
      occurrencePath,
      shapeRepresentationIds: this.shapeRepsByProductDef_.get( productDefId ) ?? [],
      children: [],
    }

    if ( this.includeSolids_ ) {
      this.appendSolidChildren( node )
    }

    const childUsages = this.nauosByParent_.get( productDefId )

    if ( childUsages === void 0 || onPath.has( productDefId ) ) {
      return node
    }

    onPath.add( productDefId )

    for ( const childUsage of childUsages ) {

      const childDefId = childUsage.related_product_definition?.expressID

      if ( childDefId === void 0 ) {
        continue
      }

      const childDef = this.productDefById_.get( childDefId )

      if ( childDef === void 0 ) {
        continue
      }

      node.children.push( this.buildNode( childDef, childUsage, occurrencePath, onPath ) )
    }

    onPath.delete( productDefId )

    return node
  }

  /**
   * Append this node's ephemeral solid children, applying the layer's
   * heuristics (see {@link ProductStructureOptions}): nothing for a
   * single-solid product, full suppression for oversized all-unnamed sets,
   * and the hard per-product cap — suppressed/overflow counts are surfaced
   * via {@link ProductStructureNode.droppedSolids}.
   *
   * @param node The product/occurrence node to attach solid children to.
   */
  private appendSolidChildren( node: ProductStructureNode ): void {

    const solids = this.solidsByProductDef_.get( node.productDefinitionExpressID )

    if ( solids === void 0 || solids.length < MIN_SOLIDS_FOR_EPHEMERAL ) {
      return
    }

    const hasNamedSolid = solids.some( ( solid ) => isMeaningfulName( solid.name ) )

    if ( !hasNamedSolid && solids.length > this.maxUnnamedSolidsPerProduct_ ) {
      node.droppedSolids = solids.length
      return
    }

    let emitted = solids

    if ( solids.length > this.maxSolidsPerProduct_ ) {
      emitted = solids.slice( 0, this.maxSolidsPerProduct_ )
      node.droppedSolids = solids.length - emitted.length
    }

    for ( let index = 0; index < emitted.length; ++index ) {

      const solid = emitted[ index ]

      node.children.push( {
        expressID: solid.expressID,
        type: SOLID_NODE_TYPE,
        name: isMeaningfulName( solid.name ) ?
          solid.name : `Solid ${index + 1} of ${solids.length}`,
        productDefinitionExpressID: node.productDefinitionExpressID,
        // A solid is not an occurrence: the path stays NAUO-only, and the
        // selection identity is the (occurrencePath, expressID) pair.
        occurrencePath: [ ...node.occurrencePath ],
        shapeRepresentationIds: [ solid.representationId ],
        children: [],
        ephemeral: true,
      } )
    }
  }

  /**
   * Resolve a node label, preferring the product name, then the occurrence's
   * own name / reference designator.
   *
   * @param productDef The product definition for the node.
   * @param occurrence The NAUO edge, when this is an occurrence node.
   * @return {string} The best available human-readable label.
   */
  private resolveLabel(
      productDef: product_definition,
      occurrence: next_assembly_usage_occurrence | undefined ): string {

    const productName = productDef.formation?.of_product?.name

    if ( productName !== void 0 && productName.length > 0 ) {
      return productName
    }

    if ( occurrence !== void 0 ) {

      if ( occurrence.name.length > 0 ) {
        return occurrence.name
      }

      const referenceDesignator = occurrence.reference_designator

      if ( referenceDesignator !== null && referenceDesignator.length > 0 ) {
        return referenceDesignator
      }
    }

    return productDef.name ?? ''
  }

  /**
   * Resolve the owning `product_definition` express id from a
   * `property_definition`-style `definition` select. Handles the direct
   * `product_definition` case and the `product_definition_shape` indirection
   * (its own `definition` points at the product definition).
   *
   * @param definition The resolved `definition` reference, or `undefined`.
   * @return {number | undefined} The product definition express id, or
   * `undefined` if it does not resolve to one.
   */
  static resolveProductDefinitionId(
      definition: { expressID?: number } | undefined ): number | undefined {

    if ( definition === void 0 ) {
      return void 0
    }

    if ( definition instanceof product_definition ) {
      return definition.expressID
    }

    if ( definition instanceof product_definition_shape ) {
      return AP214ProductStructureExtraction.resolveProductDefinitionId( definition.definition )
    }

    return void 0
  }
}
