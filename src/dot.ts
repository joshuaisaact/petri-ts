import type { Marking, PetriNet } from "./core";

function escapeDot(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/[<>{}|]/g, "\\$&");
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

  for (let i = 0; i < net.transitions.length; i++) {
    const t = net.transitions[i]!;
    const id = `t${i}`;
    const esc = escapeDot(t.name);
    dot += `  "${id}" [shape=box style=filled fillcolor=lightgrey label="${esc}"];\n`;
  }

  dot += "\n";

  for (let i = 0; i < net.transitions.length; i++) {
    const t = net.transitions[i]!;
    const id = `t${i}`;
    for (const input of t.inputs) {
      dot += `  "${escapeDot(input)}" -> "${id}";\n`;
    }
    for (const output of t.outputs) {
      dot += `  "${id}" -> "${escapeDot(output)}";\n`;
    }
  }

  dot += "}\n";
  return dot;
}
