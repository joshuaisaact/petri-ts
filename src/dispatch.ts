import type { Marking, PetriNet } from "./core";
import { fire } from "./core";

export type InstanceState<Place extends string> = {
  marking: Marking<Place>;
  version?: string;
};

export type PersistenceAdapter<Place extends string> = {
  load(id: string): Promise<InstanceState<Place>>;
  /**
   * Persist state. If `expectedVersion` is provided, the adapter should
   * throw if the stored version does not match (optimistic concurrency).
   */
  save(
    id: string,
    state: InstanceState<Place>,
    expectedVersion?: string,
  ): Promise<void>;
};

export function memoryAdapter<
  Place extends string,
>(): PersistenceAdapter<Place> {
  const store = new Map<string, InstanceState<Place>>();

  return {
    async load(id) {
      const state = store.get(id);
      if (!state) throw new Error(`Instance not found: ${id}`);
      return structuredClone(state);
    },
    async save(id, state, expectedVersion) {
      if (expectedVersion !== undefined) {
        const existing = store.get(id);
        if (existing?.version !== expectedVersion) {
          throw new Error(
            `Version conflict: expected ${expectedVersion}, got ${existing?.version}`,
          );
        }
      }
      store.set(id, structuredClone(state));
    },
  };
}

export type DispatcherOptions = {
  generateVersion?: () => string;
};

export type Dispatcher<Place extends string> = {
  create(id: string, version?: string): Promise<Marking<Place>>;
  dispatch(id: string, transitionName: string): Promise<Marking<Place>>;
  inspect(id: string): Promise<InstanceState<Place>>;
};

export function createDispatcher<Place extends string>(
  net: PetriNet<Place>,
  adapter: PersistenceAdapter<Place>,
  options?: DispatcherOptions,
): Dispatcher<Place> {
  const generateVersion = options?.generateVersion ?? (() => crypto.randomUUID());

  return {
    async create(id: string, version?: string) {
      let exists = true;
      try {
        await adapter.load(id);
      } catch {
        exists = false;
      }
      if (exists) {
        throw new Error(`Instance already exists: ${id}`);
      }
      const state: InstanceState<Place> = {
        marking: Object.assign(Object.create(null), net.initialMarking) as Marking<Place>,
        version,
      };
      await adapter.save(id, state);
      return state.marking;
    },

    async dispatch(id: string, transitionName: string) {
      const state = await adapter.load(id);
      const transition = net.transitions.find(
        (t) => t.name === transitionName,
      );
      if (!transition) {
        throw new Error(`Unknown transition: ${transitionName}`);
      }
      const previousVersion = state.version;
      state.marking = fire(state.marking, transition);
      state.version = generateVersion();
      await adapter.save(id, state, previousVersion);
      return state.marking;
    },

    async inspect(id: string) {
      return adapter.load(id);
    },
  };
}
