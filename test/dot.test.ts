import { describe, it, expect } from "vitest";
import type { PetriNet } from "../src/core";
import { toDot } from "../src/dot";

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
    expect(dot).toContain('"go" [shape=box');
    expect(dot).toContain('"a" -> "go"');
    expect(dot).toContain('"go" -> "b"');
    expect(dot).toContain("a\\n1");
    expect(dot).toContain("b\\n0");
  });

  it("uses provided marking instead of initial", () => {
    const dot = toDot(net, { a: 0, b: 1 });
    expect(dot).toContain("a\\n0");
    expect(dot).toContain("b\\n1");
  });
});
