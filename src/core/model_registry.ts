import { EntityAddress, parseEntityAddress } from './model_uri'
import { SharedByteBudget } from './shared_byte_budget'


/**
 * A model resolved from the registry, paired with the express ID an address
 * selected within it.
 */
export interface ResolvedEntity<H> {
  model: H
  expressID: number
}


/**
 * The set of open models in one browser session (M5 / design S3).
 *
 * Federation is a registry of loader instances keyed by **model URI**, all
 * sharing one {@link SharedByteBudget} so total resident memory is bounded per
 * browser rather than per model. An {@link EntityAddress} (`modelURI#expressID`)
 * resolves through here to the live model handle; a URI with no registered
 * model is the signal to open a sibling loader (its own sidecar/stream) and
 * register it.
 *
 * The registry is deliberately generic over the model handle `H` — it owns
 * identity, resolution and the shared budget, not the loader. The streaming
 * loader registers its model instance; higher layers (the composed skeleton,
 * the UI link layer) query through the same addresses.
 */
export class ModelRegistry<H> {

  private readonly byURI_ = new Map<string, H>()

  private readonly budget_: SharedByteBudget

  /**
   * @param budget The shared per-browser byte budget every registered model
   * draws from.
   */
  constructor( budget: SharedByteBudget ) {
    this.budget_ = budget
  }

  /**
   * @return {SharedByteBudget} The shared budget all registered models draw
   * from.
   */
  public get budget(): SharedByteBudget {
    return this.budget_
  }

  /**
   * @return {number} The number of registered models.
   */
  public get size(): number {
    return this.byURI_.size
  }

  /**
   * @return {IterableIterator<string>} The URIs of all registered models.
   */
  public uris(): IterableIterator<string> {
    return this.byURI_.keys()
  }

  /**
   * @return {IterableIterator<H>} The registered model handles.
   */
  public models(): IterableIterator<H> {
    return this.byURI_.values()
  }

  /**
   * Register (or replace) the model for a URI.
   *
   * @param uri The model URI (no `#` fragment).
   * @param model The model handle.
   */
  public register( uri: string, model: H ): void {

    if ( uri.includes( '#' ) ) {
      throw new Error( `Model URI must not contain '#': ${uri}` )
    }

    this.byURI_.set( uri, model )
  }

  /**
   * Remove a model from the registry.
   *
   * @param uri The model URI.
   * @return {boolean} True if a model was removed.
   */
  public unregister( uri: string ): boolean {
    return this.byURI_.delete( uri )
  }

  /**
   * @param uri The model URI.
   * @return {boolean} True if a model is registered for the URI.
   */
  public has( uri: string ): boolean {
    return this.byURI_.has( uri )
  }

  /**
   * @param uri The model URI.
   * @return {H | undefined} The registered model, or undefined.
   */
  public get( uri: string ): H | undefined {
    return this.byURI_.get( uri )
  }

  /**
   * Resolve an entity address to its model + express ID. Returns undefined
   * when the address's model isn't registered — the caller's cue to open and
   * register it, then resolve again.
   *
   * @param address The entity address, as a URI string or a parsed
   * {@link EntityAddress}.
   * @return {ResolvedEntity | undefined} The resolved model + express ID, or
   * undefined if the model isn't registered.
   */
  public resolve( address: string | EntityAddress ): ResolvedEntity<H> | undefined {

    const { modelURI, expressID } =
      typeof address === 'string' ? parseEntityAddress( address ) : address

    const model = this.byURI_.get( modelURI )

    return model === void 0 ? void 0 : { model, expressID }
  }
}
