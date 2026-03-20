export { canFire, fire } from "./core";
export type { Marking, Transition, PetriNet } from "./core";

export {
  reachableStates,
  terminalStates,
  isDeadlockFree,
  enabledTransitions,
  checkInvariant,
  analyse,
} from "./analysis";
export type { AnalysisResult, AnalyseOptions } from "./analysis";

export { toDot } from "./dot";

export { createDispatcher, memoryAdapter } from "./dispatch";
export type { InstanceState, PersistenceAdapter } from "./dispatch";
