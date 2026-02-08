export { canFire, fire } from "./core";
export type { Marking, Transition, PetriNet } from "./core";

export {
  reachableStates,
  terminalStates,
  isDeadlockFree,
  enabledTransitions,
  checkInvariant,
} from "./analysis";

export { toDot } from "./dot";

export { createDispatcher, memoryAdapter } from "./dispatch";
export type { InstanceState, PersistenceAdapter } from "./dispatch";

export { analyse } from "./analyse";
export type { AnalysisResult, AnalyseOptions } from "./analyse";
