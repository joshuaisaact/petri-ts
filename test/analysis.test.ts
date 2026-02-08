import { describe, it, expect } from "vitest";
import type { PetriNet } from "../src/core";
import {
  reachableStates,
  terminalStates,
  isDeadlockFree,
  enabledTransitions,
  checkInvariant,
} from "../src/analysis";

type CoffeePlace =
  | "waterCold"
  | "waterHot"
  | "beansWhole"
  | "beansGround"
  | "cupEmpty"
  | "coffeeReady";

const coffeeNet: PetriNet<CoffeePlace> = {
  transitions: [
    { name: "heatWater", inputs: ["waterCold"], outputs: ["waterHot"] },
    { name: "grindBeans", inputs: ["beansWhole"], outputs: ["beansGround"] },
    {
      name: "pourOver",
      inputs: ["waterHot", "beansGround", "cupEmpty"],
      outputs: ["coffeeReady"],
    },
  ],
  initialMarking: {
    waterCold: 1,
    waterHot: 0,
    beansWhole: 1,
    beansGround: 0,
    cupEmpty: 1,
    coffeeReady: 0,
  },
};

describe("reachableStates", () => {
  it("finds all reachable markings", () => {
    const states = reachableStates(coffeeNet);
    expect(states.length).toBe(5);
  });

  it("includes the initial marking", () => {
    const states = reachableStates(coffeeNet);
    expect(states).toContainEqual(coffeeNet.initialMarking);
  });
});

describe("terminalStates", () => {
  it("finds markings where no transition is enabled", () => {
    const terminals = terminalStates(coffeeNet);
    expect(terminals.length).toBe(1);
    expect(terminals[0]!.coffeeReady).toBe(1);
  });
});

describe("isDeadlockFree", () => {
  it("returns false when terminal states exist", () => {
    expect(isDeadlockFree(coffeeNet)).toBe(false);
  });

  it("returns true for a cyclic net", () => {
    type P = "a" | "b";
    const cyclic: PetriNet<P> = {
      transitions: [
        { name: "forward", inputs: ["a"], outputs: ["b"] },
        { name: "back", inputs: ["b"], outputs: ["a"] },
      ],
      initialMarking: { a: 1, b: 0 },
    };
    expect(isDeadlockFree(cyclic)).toBe(true);
  });
});

describe("enabledTransitions", () => {
  it("returns transitions that can fire", () => {
    const enabled = enabledTransitions(coffeeNet, coffeeNet.initialMarking);
    const names = enabled.map((t) => t.name);
    expect(names).toContain("heatWater");
    expect(names).toContain("grindBeans");
    expect(names).not.toContain("pourOver");
  });
});

describe("checkInvariant", () => {
  it("verifies a token-conservation invariant", () => {
    // weighted invariant: each ingredient has weight 1, coffeeReady has weight 3
    // because pourOver consumes 3 tokens and produces 1
    expect(
      checkInvariant(coffeeNet, {
        waterCold: 1,
        waterHot: 1,
        beansWhole: 1,
        beansGround: 1,
        cupEmpty: 1,
        coffeeReady: 3,
      }),
    ).toBe(true);
  });

  it("rejects a non-invariant", () => {
    // waterCold alone is not constant
    expect(checkInvariant(coffeeNet, { waterCold: 1 })).toBe(false);
  });
});
