export type Marking<Place extends string> = Record<Place, number>;

export type Transition<Place extends string> = {
  name: string;
  inputs: Place[];
  outputs: Place[];
};

export type PetriNet<Place extends string> = {
  transitions: Transition<Place>[];
  initialMarking: Marking<Place>;
};

export function canFire<Place extends string>(
  marking: Marking<Place>,
  transition: Transition<Place>,
): boolean {
  const required = new Map<Place, number>();
  for (const place of transition.inputs) {
    required.set(place, (required.get(place) ?? 0) + 1);
  }
  for (const [place, count] of required) {
    if ((marking[place] ?? 0) < count) return false;
  }
  return true;
}

export function fire<Place extends string>(
  marking: Marking<Place>,
  transition: Transition<Place>,
): Marking<Place> {
  if (!canFire(marking, transition)) {
    throw new Error(`Cannot fire transition: ${transition.name}`);
  }
  const newMarking = Object.assign(Object.create(null), marking) as Marking<Place>;
  for (const place of transition.inputs) newMarking[place] -= 1;
  for (const place of transition.outputs) newMarking[place] += 1;
  return newMarking;
}
