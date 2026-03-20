import type { Marking, PetriNet, Transition } from "./core";
import { canFire, fire } from "./core";
import { toDot } from "./dot";

const DEFAULT_LIMIT = 10_000;

export function reachableStates<Place extends string>(
  net: PetriNet<Place>,
  limit: number = DEFAULT_LIMIT,
): Marking<Place>[] {
  const seen = new Set<string>();
  const queue: Marking<Place>[] = [];
  const result: Marking<Place>[] = [];
  let head = 0;

  const sortedKeys = Object.keys(net.initialMarking).sort();
  const toKey = (m: Marking<Place>) => JSON.stringify(m, sortedKeys);

  seen.add(toKey(net.initialMarking));
  queue.push(net.initialMarking);

  while (head < queue.length) {
    const current = queue[head++]!;
    result.push(current);

    for (const t of net.transitions) {
      if (canFire(current, t)) {
        const next = fire(current, t);
        const key = toKey(next);
        if (!seen.has(key)) {
          if (seen.size >= limit) {
            throw new Error(
              `Reachable state space exceeded ${limit} states — the net may be unbounded`,
            );
          }
          seen.add(key);
          queue.push(next);
        }
      }
    }
  }

  return result;
}

export function enabledTransitions<Place extends string>(
  net: PetriNet<Place>,
  marking: Marking<Place>,
): Transition<Place>[] {
  return net.transitions.filter((t) => canFire(marking, t));
}

export function terminalStates<Place extends string>(
  net: PetriNet<Place>,
  states?: Marking<Place>[],
): Marking<Place>[] {
  return (states ?? reachableStates(net)).filter(
    (marking) => enabledTransitions(net, marking).length === 0,
  );
}

export function isDeadlockFree<Place extends string>(
  net: PetriNet<Place>,
  states?: Marking<Place>[],
): boolean {
  return terminalStates(net, states).length === 0;
}

export function checkInvariant<Place extends string>(
  net: PetriNet<Place>,
  weights: Partial<Record<Place, number>>,
  states?: Marking<Place>[],
): boolean {
  const resolved = states ?? reachableStates(net);

  const weightedSum = (marking: Marking<Place>): number => {
    let sum = 0;
    for (const [place, weight] of Object.entries(weights) as [Place, number | undefined][]) {
      if (weight == null) continue;
      sum += marking[place] * weight;
    }
    return sum;
  };

  if (resolved.length === 0) return true;
  const expected = weightedSum(resolved[0]!);
  return resolved.every((marking) => weightedSum(marking) === expected);
}

export type AnalysisResult<Place extends string> = {
  reachableStateCount: number;
  terminalStates: Marking<Place>[];
  isDeadlockFree: boolean;
  invariants: { weights: Partial<Record<Place, number>>; holds: boolean }[];
  dot?: string;
};

export type AnalyseOptions<Place extends string> = {
  dot?: boolean | { marking: Marking<Place> };
  invariants?: { weights: Partial<Record<Place, number>> }[];
};

export function analyse<Place extends string>(
  net: PetriNet<Place>,
  options: AnalyseOptions<Place> = {},
): AnalysisResult<Place> {
  const reachable = reachableStates(net);
  const terminal = terminalStates(net, reachable);
  const deadlockFree = terminal.length === 0;

  const invariantResults = (options.invariants ?? []).map((inv) => ({
    weights: inv.weights,
    holds: checkInvariant(net, inv.weights, reachable),
  }));

  return {
    reachableStateCount: reachable.length,
    terminalStates: terminal,
    isDeadlockFree: deadlockFree,
    invariants: invariantResults,
    dot: options.dot
      ? toDot(net, typeof options.dot === "object" ? options.dot.marking : undefined)
      : undefined,
  };
}
