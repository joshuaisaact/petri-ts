import type { Marking, PetriNet } from "./core";
import { canFire, fire } from "./core";

export type InstanceState<Place extends string> = {
  marking: Marking<Place>;
  version?: string;
};

export type PersistenceAdapter<Place extends string> = {
  load(id: string): Promise<InstanceState<Place>>;
  save(id: string, state: InstanceState<Place>): Promise<void>;
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
    async save(id, state) {
      store.set(id, structuredClone(state));
    },
  };
}

export function createDispatcher<Place extends string>(
  net: PetriNet<Place>,
  adapter: PersistenceAdapter<Place>,
) {
  return {
    async create(id: string, version?: string) {
      const state: InstanceState<Place> = {
        marking: { ...net.initialMarking },
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
      if (!canFire(state.marking, transition)) {
        throw new Error(`Cannot fire transition: ${transitionName}`);
      }
      state.marking = fire(state.marking, transition);
      await adapter.save(id, state);
      return state.marking;
    },

    async inspect(id: string) {
      return adapter.load(id);
    },
  };
}
