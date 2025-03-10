/**
 * Represents a pool that manages a set of reusable objects.
 */
export class ObjectPool<T> {
  private readonly factory: () => T
  private readonly destroy: (obj: T) => void
  private pool: T[] = []

  /**
   * Creates an instance of ObjectPool.
   * @param factory A function used to create a new object when the pool is empty.
   * @param destroy A function used to destroy objects when clearing the pool.
   */
  constructor(factory: () => T, destroy: (obj: T) => void) {
    this.factory = factory
    this.destroy = destroy
  }

   
  /**
   * Acquires an object from the pool or creates a new one if the pool is empty.
   * @returns An object from the pool or a new one if the pool is empty.
   */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop() as T
    }
    return this.factory()
  }
   

  /**
   * Releases an object back into the pool for reuse.
   * @param obj The object to be released into the pool.
   */
  release(obj: T): void {
    this.pool.push(obj)
  }

  /**
   * Destroys all objects in the pool and empties it.
   */
  clear(): void {
    for (const obj of this.pool) {
      this.destroy(obj)
    }
    this.pool.length = 0
  }
}
