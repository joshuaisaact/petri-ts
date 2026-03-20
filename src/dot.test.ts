import { describe, it, expect } from "vitest";
import type { PetriNet } from "./core";
import { toDot } from "./dot";

type P = "a" | "b";

const net: PetriNet<P> = {
  transitions: [{ name: "go", inputs: ["a"], outputs: ["b"] }],
  initialMarking: { a: 1, b: 0 },
};

describe("toDot", () => {
  it("produces valid DOT output", () => {
    const dot = toDot(net);
    expect(dot).toContain("digraph {");
    expect(dot).toContain('"a" [shape=circle');
    expect(dot).toContain('"t0" [shape=box');
    expect(dot).toContain('label="go"');
    expect(dot).toContain('"a" -> "t0"');
    expect(dot).toContain('"t0" -> "b"');
    expect(dot).toContain("a\\n1");
    expect(dot).toContain("b\\n0");
  });

  it("uses provided marking instead of initial", () => {
    const dot = toDot(net, { a: 0, b: 1 });
    expect(dot).toContain("a\\n0");
    expect(dot).toContain("b\\n1");
  });

  it("escapes double quotes and backslashes in names", () => {
    type Q = 'say "hi"' | "back\\slash";
    const special: PetriNet<Q> = {
      transitions: [
        {
          name: 'trans"ition',
          inputs: ['say "hi"'],
          outputs: ["back\\slash"],
        },
      ],
      initialMarking: { 'say "hi"': 1, "back\\slash": 0 },
    };
    const dot = toDot(special);
    expect(dot).toContain('"say \\"hi\\""');
    expect(dot).toContain('"back\\\\slash"');
    expect(dot).toContain('label="trans\\"ition"');
    expect(dot).not.toMatch(/[^\\]"hi"/);
  });

  it("handles duplicate transition names with unique IDs", () => {
    const dupNet: PetriNet<P> = {
      transitions: [
        { name: "step", inputs: ["a"], outputs: ["b"] },
        { name: "step", inputs: ["b"], outputs: ["a"] },
      ],
      initialMarking: { a: 1, b: 0 },
    };
    const dot = toDot(dupNet);
    expect(dot).toContain('"t0"');
    expect(dot).toContain('"t1"');
    expect(dot).toContain('"a" -> "t0"');
    expect(dot).toContain('"t1" -> "a"');
  });

  it("escapes angle brackets, braces, and pipes", () => {
    type Q = "a<b>" | "c|d";
    const special: PetriNet<Q> = {
      transitions: [{ name: "{t}", inputs: ["a<b>"], outputs: ["c|d"] }],
      initialMarking: { "a<b>": 1, "c|d": 0 },
    };
    const dot = toDot(special);
    expect(dot).toContain("a\\<b\\>");
    expect(dot).toContain("c\\|d");
    expect(dot).toContain('label="\\{t\\}"');
  });
});
