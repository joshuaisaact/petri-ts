import type { Marking, PetriNet } from "./core";

export function toDot<Place extends string>(
  net: PetriNet<Place>,
  marking?: Marking<Place>,
): string {
  const m = marking ?? net.initialMarking;
  const places = Object.keys(m) as Place[];

  let dot = "digraph {\n  rankdir=LR;\n\n";

  for (const place of places) {
    const tokens = m[place];
    dot += `  "${place}" [shape=circle label="${place}\\n${tokens}"];\n`;
  }

  dot += "\n";

  for (const t of net.transitions) {
    dot += `  "${t.name}" [shape=box style=filled fillcolor=lightgrey];\n`;
  }

  dot += "\n";

  for (const t of net.transitions) {
    for (const input of t.inputs) {
      dot += `  "${input}" -> "${t.name}";\n`;
    }
    for (const output of t.outputs) {
      dot += `  "${t.name}" -> "${output}";\n`;
    }
  }

  dot += "}\n";
  return dot;
}
