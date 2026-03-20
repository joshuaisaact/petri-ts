import type { Marking, PetriNet } from "./core";

function escapeDot(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function toDot<Place extends string>(
  net: PetriNet<Place>,
  marking?: Marking<Place>,
): string {
  const m = marking ?? net.initialMarking;
  const places = Object.keys(m) as Place[];

  let dot = "digraph {\n  rankdir=LR;\n\n";

  for (const place of places) {
    const tokens = m[place];
    const esc = escapeDot(place);
    dot += `  "${esc}" [shape=circle label="${esc}\\n${tokens}"];\n`;
  }

  dot += "\n";

  for (const t of net.transitions) {
    const esc = escapeDot(t.name);
    dot += `  "${esc}" [shape=box style=filled fillcolor=lightgrey];\n`;
  }

  dot += "\n";

  for (const t of net.transitions) {
    const escName = escapeDot(t.name);
    for (const input of t.inputs) {
      dot += `  "${escapeDot(input)}" -> "${escName}";\n`;
    }
    for (const output of t.outputs) {
      dot += `  "${escName}" -> "${escapeDot(output)}";\n`;
    }
  }

  dot += "}\n";
  return dot;
}
