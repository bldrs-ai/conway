import { StepEntityConstructorAbstract } from '../step/step_entity_constructor'
import { EntityAddress } from './model_uri'
import { ModelRegistry } from './model_registry'


/**
 * A model that can answer a type query — the minimum a federated model must
 * expose to take part in cross-file composition. Both the resident model's
 * type index and the streaming {@link IncrementalTypeIndex} satisfy this, so a
 * composed view works whether its members are fully parsed or still streaming.
 */
export interface TypeQueryableModel<TypeIDType extends number> {

  /**
   * Express IDs of all records of the given types (including subtypes).
   *
   * @param types The entity constructors to query.
   * @return {IterableIterator<number>} The matching express IDs.
   */
  expressIDsOfTypes(
    ...types: StepEntityConstructorAbstract<TypeIDType>[] ): IterableIterator<number>
}


/**
 * A composed view over every model in a {@link ModelRegistry} (M5 / design S3).
 *
 * Federation's read side: a site plan that references per-building files, or a
 * project split across disciplines, is browsed as **one** model whose entities
 * carry universal {@link EntityAddress}es (`modelURI#expressID`). A type query
 * here fans out across all registered members and yields addresses, not bare
 * express IDs — so "every `IfcWall` in the project" spans files, and each
 * result round-trips back through {@link ModelRegistry.resolve} to the right
 * model.
 *
 * This is the composition scaffold: it unions the members' type skeletons
 * under the shared address space. The spatial-containment merge (a site's
 * `IfcRelAggregates` linking to building files) layers on top by resolving the
 * cross-file references the {@link CrossReferenceRegistry} discovers — the next
 * increment, gated on the loader registering streamed models here.
 */
export class ComposedModelSkeleton<
  TypeIDType extends number,
  H extends TypeQueryableModel<TypeIDType>> {

  /**
   * @param registry_ The registry whose models this composes over.
   */
  constructor( private readonly registry_: ModelRegistry<H> ) {}

  /**
   * @return {ModelRegistry<H>} The registry backing this composed view.
   */
  public get registry(): ModelRegistry<H> {
    return this.registry_
  }

  /**
   * Yield the universal address of every entity of the given types across all
   * registered models.
   *
   * @param types The entity constructors to query (subtype closures unioned).
   * @return {IterableIterator<EntityAddress>} Addresses of matching entities.
   * @yields {EntityAddress} Each matching entity's universal address.
   */
  public* entitiesOfType(
      ...types: StepEntityConstructorAbstract<TypeIDType>[] ):
      IterableIterator<EntityAddress> {

    for ( const modelURI of this.registry_.uris() ) {

      const model = this.registry_.get( modelURI )

      if ( model === void 0 ) {
        continue
      }

      for ( const expressID of model.expressIDsOfTypes( ...types ) ) {
        yield { modelURI, expressID }
      }
    }
  }

  /**
   * Count entities of the given types across all registered models.
   *
   * @param types The entity constructors to count.
   * @return {number} The total across the federation.
   */
  public countOfType(
      ...types: StepEntityConstructorAbstract<TypeIDType>[] ): number {

    let total = 0

    for ( const model of this.registry_.models() ) {
      for ( const expressID of model.expressIDsOfTypes( ...types ) ) {
        void expressID
        ++total
      }
    }

    return total
  }
}
