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
  return transition.inputs.every((place) => marking[place] > 0);
}

export function fire<Place extends string>(
  marking: Marking<Place>,
  transition: Transition<Place>,
): Marking<Place> {
  if (!canFire(marking, transition)) {
    throw new Error(`Cannot fire transition: ${transition.name}`);
  }
  const newMarking = { ...marking };
  for (const place of transition.inputs) newMarking[place] -= 1;
  for (const place of transition.outputs) newMarking[place] += 1;
  return newMarking;
}
