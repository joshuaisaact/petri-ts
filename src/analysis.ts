import type { Marking, PetriNet, Transition } from "./core";
import { canFire, fire } from "./core";

export function reachableStates<Place extends string>(
  net: PetriNet<Place>,
): Marking<Place>[] {
  const seen = new Set<string>();
  const queue: Marking<Place>[] = [net.initialMarking];
  const result: Marking<Place>[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = JSON.stringify(current);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(current);

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
): Marking<Place>[] {
  return reachableStates(net).filter(
    (marking) => enabledTransitions(net, marking).length === 0,
  );
}

export function isDeadlockFree<Place extends string>(
  net: PetriNet<Place>,
): boolean {
  return terminalStates(net).length === 0;
}

export function checkInvariant<Place extends string>(
  net: PetriNet<Place>,
  weights: Partial<Record<Place, number>>,
): boolean {
  const states = reachableStates(net);

  const weightedSum = (marking: Marking<Place>): number => {
    let sum = 0;
    for (const [place, weight] of Object.entries(weights) as [Place, number][]) {
      sum += marking[place] * weight;
    }
    return sum;
  };

  const expected = weightedSum(states[0]!);
  return states.every((marking) => weightedSum(marking) === expected);
}
