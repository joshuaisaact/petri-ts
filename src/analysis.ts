import type { Marking, PetriNet, Transition } from "./core";
import { canFire, fire } from "./core";

const DEFAULT_LIMIT = 10_000;

export function reachableStates<Place extends string>(
  net: PetriNet<Place>,
  limit: number = DEFAULT_LIMIT,
): Marking<Place>[] {
  const seen = new Set<string>();
  const queue: Marking<Place>[] = [net.initialMarking];
  const result: Marking<Place>[] = [];
  let head = 0;

  while (head < queue.length) {
    const current = queue[head++]!;
    const key = JSON.stringify(current, Object.keys(current).sort());
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(current);

    if (seen.size > limit) {
      throw new Error(
        `Reachable state space exceeded ${limit} states — the net may be unbounded`,
      );
    }

    for (const t of net.transitions) {
      if (canFire(current, t)) {
        queue.push(fire(current, t));
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
    for (const [place, weight] of Object.entries(weights) as [Place, number][]) {
      sum += marking[place] * weight;
    }
    return sum;
  };

  const expected = weightedSum(resolved[0]!);
  return resolved.every((marking) => weightedSum(marking) === expected);
}
