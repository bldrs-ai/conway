import { RecordEventHandler } from '../step/parsing/record_event'
import { RecordFieldCursor } from '../step/parsing/record_field_cursor'
import EntityTypesIfc from './ifc4_gen/entity_types_ifc.gen'
import {
  IfcContext,
  IfcObjectDefinition,
  IfcRelAggregates,
  IfcRelContainedInSpatialStructure,
  IfcSpatialElement,
} from './ifc4_gen'
import IfcStepParser from './ifc_step_parser'
import { StreamingRecordDispatcher } from '../step/parsing/streaming_record_dispatcher'


/**
 * Attribute positions in the serialised record, matching the generated
 * accessors exactly (`IfcRoot.Name` is `extractString( 2, … )`, and so on).
 * STEP writes the flattened inherited list, so these are absolute positions in
 * any subtype's record.
 */
const ATTRIBUTE_GLOBAL_ID = 0
const ATTRIBUTE_NAME = 2
const ATTRIBUTE_LONG_NAME = 7

/**
 * `LongName` sits at a different position on `IfcContext` (`IfcProject`'s
 * supertype) than on `IfcSpatialElement`, because the two branches inherit
 * different prefixes — 5 against 7. The generated getters disagree the same
 * way (`IfcContext.extractString( 5, … )` vs
 * `IfcSpatialElement.extractString( 7, … )`), and reading the wrong one
 * silently yields a different attribute, not an error.
 */
const ATTRIBUTE_CONTEXT_LONG_NAME = 5
const ATTRIBUTE_AGGREGATES_RELATING = 4
const ATTRIBUTE_AGGREGATES_RELATED = 5
const ATTRIBUTE_CONTAINED_RELATED = 4
const ATTRIBUTE_CONTAINED_RELATING = 5

/** Initial capacity of the edge columns; both grow by doubling. */
const INITIAL_EDGES = 1024

/**
 * The spatial subtype closure as a set — the `LongName` test runs per named
 * record, so it must not be a scan of the closure array.
 */
const SPATIAL_TYPES = new Set<EntityTypesIfc>( IfcSpatialElement.query )

/** The context closure — `IfcProject` and friends, whose `LongName` is at 5. */
const CONTEXT_TYPES = new Set<EntityTypesIfc>( IfcContext.query )


/** One node of the skeleton: what a tree row needs, and nothing else. */
export interface SkeletonNode {

  /** The record's express ID. */
  expressID: number

  /** The record's concrete type. */
  type: EntityTypesIfc

  /** `Name`, when the record carried one. */
  name?: string

  /** `LongName`, for spatial elements that carried one. */
  longName?: string

  /** `GlobalId`, when the record carried one. */
  globalId?: string

  /** Children, in the order their relationships were parsed. */
  children: SkeletonNode[]
}


/**
 * The spatial **names skeleton** (M2, issue #393): project → site → building →
 * storey → product, with names, built from the streaming parse's record events
 * so the tree can be shown while the model is still loading.
 *
 * This is the one standard consumer that genuinely belongs on the event path,
 * and the reason is the record's *bytes*. Everything else M2 wanted —
 * membership, counts, ids — is in the columnar index and is cheaper (and, for
 * complex records, only correct) when derived from a prefix snapshot; see
 * {@link import('../step/parsing/prefix_type_index').PrefixTypeIndex}. Names
 * and relationship edges are not in the columns, and after the parse they cost
 * a second pass that pages every relationship and every named record back in
 * through the windowed provider — which is exactly what Share's post-parse
 * `'names'` sweep does today.
 *
 * What runs per record is deliberately small: tokenize the record's attribute
 * list, copy out at most three short strings, and append two integers per
 * edge. Nothing is resolved and no tree is built until {@link tree} is called —
 * "resolvable" therefore means "present when you asked", and a file that
 * forward-references its way through the spatial hierarchy simply resolves at
 * end of stream, with no pending-reference table to maintain.
 *
 * Idempotence: the streaming builder's grow-and-restart re-fires records from
 * localID 0. A non-ascending localID is taken as that restart and clears both
 * the nodes and the edge columns, so a restarted parse rebuilds rather than
 * doubling its edges.
 */
export class IfcSpatialSkeleton {

  private readonly nodes_ = new Map<number, SkeletonNode>()

  private edgeParents_ = new Uint32Array( INITIAL_EDGES )

  private edgeChildren_ = new Uint32Array( INITIAL_EDGES )

  private edgeCount_ = 0

  private readonly cursor_: RecordFieldCursor<EntityTypesIfc>

  private lastLocalID_ = -1

  /**
   * @param parser The IFC parser whose tokenizer reads the record bytes.
   * Defaults to the singleton the streaming open uses.
   */
  constructor( parser: IfcStepParser = IfcStepParser.Instance ) {
    this.cursor_ = new RecordFieldCursor<EntityTypesIfc>( parser )
  }

  /**
   * Subscribe this skeleton to a dispatcher — the object definitions it names
   * and the two relationship types it draws edges from.
   *
   * @param dispatcher The dispatcher fed by the streaming parse.
   */
  public subscribe( dispatcher: StreamingRecordDispatcher<EntityTypesIfc> ): void {
    dispatcher.on( [ IfcObjectDefinition ], this.handleObject )
    dispatcher.on(
        [ IfcRelAggregates, IfcRelContainedInSpatialStructure ], this.handleRelationship )
  }

  /**
   * @return {number} Nodes seen so far (children not yet linked).
   */
  public get nodeCount(): number {
    return this.nodes_.size
  }

  /**
   * @return {number} Containment edges captured so far.
   */
  public get edgeCount(): number {
    return this.edgeCount_
  }

  /**
   * Record a named object definition. Bound for direct use as a subscription.
   *
   * @param localID The record's dense local ID.
   * @param expressID The record's express ID.
   * @param typeID The record's concrete type.
   * @param buffer The live parse window holding the record.
   * @param byteOffset Offset of the record's attribute list in `buffer`.
   * @param byteLength Length of the attribute list.
   */
  private readonly handleObject: RecordEventHandler<EntityTypesIfc> = (
      localID: number,
      expressID: number,
      typeID: EntityTypesIfc | undefined,
      buffer?: Uint8Array,
      byteOffset?: number,
      byteLength?: number ): void => {

    this.noteRestart( localID )

    if ( typeID === void 0 || buffer === void 0 ||
         byteOffset === void 0 || byteLength === void 0 ) {
      return
    }

    if ( this.cursor_.open( buffer, byteOffset, byteLength ) === 0 ) {
      return
    }

    const node: SkeletonNode = { expressID, type: typeID, children: [] }

    const globalId = this.cursor_.string( ATTRIBUTE_GLOBAL_ID )
    const name = this.cursor_.string( ATTRIBUTE_NAME )

    if ( globalId !== void 0 ) {
      node.globalId = globalId
    }

    if ( name !== void 0 ) {
      node.name = name
    }

    // LongName is what a row actually displays when Name is a code. Only
    // spatial elements and contexts carry it, at different positions.
    const longNameAt = this.longNameAttribute( typeID )

    if ( longNameAt !== void 0 ) {
      const longName = this.cursor_.string( longNameAt )

      if ( longName !== void 0 ) {
        node.longName = longName
      }
    }

    this.nodes_.set( expressID, node )
  }

  /**
   * Where this type keeps `LongName`, if it has one.
   *
   * @param typeID The record's concrete type.
   * @return {number | undefined} The attribute index, or undefined for types
   * that carry no `LongName` at all.
   */
  private longNameAttribute( typeID: EntityTypesIfc ): number | undefined {
    if ( SPATIAL_TYPES.has( typeID ) ) {
      return ATTRIBUTE_LONG_NAME
    }

    return CONTEXT_TYPES.has( typeID ) ? ATTRIBUTE_CONTEXT_LONG_NAME : void 0
  }

  /**
   * Record the containment edges of one relationship. Bound for direct use as
   * a subscription.
   *
   * @param localID The record's dense local ID.
   * @param expressID The record's express ID.
   * @param typeID The record's concrete type.
   * @param buffer The live parse window holding the record.
   * @param byteOffset Offset of the record's attribute list in `buffer`.
   * @param byteLength Length of the attribute list.
   */
  private readonly handleRelationship: RecordEventHandler<EntityTypesIfc> = (
      localID: number,
      expressID: number,
      typeID: EntityTypesIfc | undefined,
      buffer?: Uint8Array,
      byteOffset?: number,
      byteLength?: number ): void => {

    this.noteRestart( localID )

    if ( typeID === void 0 || buffer === void 0 ||
         byteOffset === void 0 || byteLength === void 0 ) {
      return
    }

    if ( this.cursor_.open( buffer, byteOffset, byteLength ) === 0 ) {
      return
    }

    // The two relationships put their parent on opposite sides.
    const aggregates = typeID === EntityTypesIfc.IFCRELAGGREGATES

    const parentIndex =
      aggregates ? ATTRIBUTE_AGGREGATES_RELATING : ATTRIBUTE_CONTAINED_RELATING
    const childrenIndex =
      aggregates ? ATTRIBUTE_AGGREGATES_RELATED : ATTRIBUTE_CONTAINED_RELATED

    const parent = this.cursor_.reference( parentIndex )

    if ( parent === void 0 ) {
      return
    }

    this.cursor_.forEachReference( childrenIndex, ( child ) => {
      this.pushEdge( parent, child )
    } )
  }

  /**
   * Reset if the parse restarted. localIDs ascend strictly within a run, so a
   * localID that does not exceed the last one seen means the streaming
   * builder hit its grow-and-restart valve and is re-firing from 0. Testing
   * for `localID === 0` would not do: this consumer only sees its subscribed
   * types, and record 0 is rarely one of them.
   *
   * @param localID The record's dense local ID.
   */
  private noteRestart( localID: number ): void {
    if ( localID <= this.lastLocalID_ ) {
      this.edgeCount_ = 0
      this.nodes_.clear()
    }

    this.lastLocalID_ = localID
  }

  /**
   * Append one containment edge, growing the columns as needed.
   *
   * @param parent Express ID of the containing entity.
   * @param child Express ID of the contained entity.
   */
  private pushEdge( parent: number, child: number ): void {
    if ( this.edgeCount_ === this.edgeParents_.length ) {
      const parents = new Uint32Array( this.edgeParents_.length * 2 )
      const children = new Uint32Array( this.edgeChildren_.length * 2 )

      parents.set( this.edgeParents_ )
      children.set( this.edgeChildren_ )

      this.edgeParents_ = parents
      this.edgeChildren_ = children
    }

    this.edgeParents_[ this.edgeCount_ ] = parent
    this.edgeChildren_[ this.edgeCount_ ] = child
    ++this.edgeCount_
  }

  /**
   * Look one node up without building the tree.
   *
   * @param expressID The express ID.
   * @return {SkeletonNode | undefined} The node, if it has been parsed.
   */
  public node( expressID: number ): SkeletonNode | undefined {
    return this.nodes_.get( expressID )
  }

  /**
   * Build the tree over everything parsed so far and return its roots — nodes
   * that are nobody's child. That is the project once it has been seen, plus
   * whatever a prefix has not reached the parent of yet, plus the object
   * definitions that genuinely hang outside the spatial hierarchy (type
   * objects, ungrouped actors); a caller that wants strictly the spatial tree
   * should walk down from the project's express ID rather than treat every
   * root as spatial.
   *
   * Each call relinks children from the edge columns, so a caller may call it
   * repeatedly as the parse advances; the returned nodes are the live ones, so
   * a previously returned tree is not a snapshot.
   *
   * @return {SkeletonNode[]} The roots, in parse order.
   */
  public tree(): SkeletonNode[] {
    const children = new Set<number>()

    for ( const node of this.nodes_.values() ) {
      node.children.length = 0
    }

    for ( let edge = 0; edge < this.edgeCount_; ++edge ) {
      const parent = this.nodes_.get( this.edgeParents_[ edge ] )
      const child = this.nodes_.get( this.edgeChildren_[ edge ] )

      if ( parent === void 0 || child === void 0 ) {
        // Either end may be a forward reference the parse has not reached.
        // Nothing is remembered as pending: the edge is re-read on the next
        // call, so it links as soon as both ends exist.
        continue
      }

      parent.children.push( child )
      children.add( child.expressID )
    }

    const roots: SkeletonNode[] = []

    for ( const node of this.nodes_.values() ) {
      if ( !children.has( node.expressID ) ) {
        roots.push( node )
      }
    }

    return roots
  }
}
