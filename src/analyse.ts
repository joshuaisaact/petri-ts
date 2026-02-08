import type { PetriNet, Marking } from "./core";
import {
  reachableStates,
  terminalStates,
  isDeadlockFree,
  checkInvariant,
} from "./analysis";
import { toDot } from "./dot";

export type AnalysisResult<Place extends string> = {
  reachableStateCount: number;
  terminalStates: Marking<Place>[];
  isDeadlockFree: boolean;
  invariants: { weights: Partial<Record<Place, number>>; holds: boolean }[];
  dot?: string;
};

export type AnalyseOptions<Place extends string> = {
  dot?: boolean;
  invariants?: { weights: Partial<Record<Place, number>> }[];
};

export function analyse<Place extends string>(
  net: PetriNet<Place>,
  options: AnalyseOptions<Place> = {},
): AnalysisResult<Place> {
  const reachable = reachableStates(net);
  const terminal = terminalStates(net);
  const deadlockFree = isDeadlockFree(net);

  const invariantResults = (options.invariants ?? []).map((inv) => ({
    weights: inv.weights,
    holds: checkInvariant(net, inv.weights),
  }));

  return {
    reachableStateCount: reachable.length,
    terminalStates: terminal,
    isDeadlockFree: deadlockFree,
    invariants: invariantResults,
    dot: options.dot ? toDot(net) : undefined,
  };
}
