import { describe, it, expect } from "vitest";
import type { PetriNet } from "./core";
import {
  reachableStates,
  terminalStates,
  isDeadlockFree,
  enabledTransitions,
  checkInvariant,
  analyse,
} from "./analysis";

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

  it("throws when state space exceeds limit", () => {
    type P = "a";
    const unbounded: PetriNet<P> = {
      transitions: [{ name: "grow", inputs: [], outputs: ["a"] }],
      initialMarking: { a: 0 },
    };
    expect(() => reachableStates(unbounded, 50)).toThrow(
      "exceeded 50 states",
    );
  });

  it("includes the initial marking", () => {
    const states = reachableStates(coffeeNet);
    expect(states).toContainEqual(coffeeNet.initialMarking);
  });

  it("deduplicates markings regardless of key insertion order", () => {
    // Keys in different order but same values should be treated as the same state
    type P = "x" | "y";
    const net: PetriNet<P> = {
      transitions: [
        { name: "swap", inputs: ["x"], outputs: ["y"] },
        { name: "back", inputs: ["y"], outputs: ["x"] },
      ],
      // Key order: x, y
      initialMarking: { x: 1, y: 0 },
    };
    const states = reachableStates(net);
    // Only 2 reachable states: {x:1,y:0} and {x:0,y:1}
    expect(states.length).toBe(2);
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

describe("analyse", () => {
  it("returns reachable state count", () => {
    const result = analyse(coffeeNet);
    expect(result.reachableStateCount).toBe(5);
  });

  it("returns terminal states", () => {
    const result = analyse(coffeeNet);
    expect(result.terminalStates).toHaveLength(1);
    expect(result.terminalStates[0]!.coffeeReady).toBe(1);
  });

  it("reports deadlock status", () => {
    expect(analyse(coffeeNet).isDeadlockFree).toBe(false);

    type P = "a" | "b";
    const cyclic: PetriNet<P> = {
      transitions: [
        { name: "forward", inputs: ["a"], outputs: ["b"] },
        { name: "back", inputs: ["b"], outputs: ["a"] },
      ],
      initialMarking: { a: 1, b: 0 },
    };
    expect(analyse(cyclic).isDeadlockFree).toBe(true);
  });

  it("checks invariants", () => {
    const result = analyse(coffeeNet, {
      invariants: [
        {
          weights: {
            waterCold: 1,
            waterHot: 1,
            beansWhole: 1,
            beansGround: 1,
            cupEmpty: 1,
            coffeeReady: 3,
          },
        },
        { weights: { waterCold: 1 } },
      ],
    });

    expect(result.invariants).toHaveLength(2);
    expect(result.invariants[0]!.holds).toBe(true);
    expect(result.invariants[1]!.holds).toBe(false);
  });

  it("generates DOT output when requested", () => {
    const without = analyse(coffeeNet);
    expect(without.dot).toBeUndefined();

    const with_ = analyse(coffeeNet, { dot: true });
    expect(with_.dot).toBeDefined();
    expect(with_.dot).toContain("digraph");
  });

  it("works with checkout net (resource contention)", () => {
    type CheckoutPlace =
      | "cartReady"
      | "inventory"
      | "inventoryReserved"
      | "paymentPending"
      | "paymentComplete"
      | "paymentFailed"
      | "orderFulfilled"
      | "orderCancelled";

    const checkoutNet: PetriNet<CheckoutPlace> = {
      transitions: [
        {
          name: "beginCheckout",
          inputs: ["cartReady", "inventory"],
          outputs: ["inventoryReserved", "paymentPending"],
        },
        {
          name: "completePayment",
          inputs: ["paymentPending"],
          outputs: ["paymentComplete"],
        },
        {
          name: "failPayment",
          inputs: ["paymentPending"],
          outputs: ["paymentFailed"],
        },
        {
          name: "fulfillOrder",
          inputs: ["paymentComplete", "inventoryReserved"],
          outputs: ["orderFulfilled"],
        },
        {
          name: "cancelOrder",
          inputs: ["paymentFailed", "inventoryReserved"],
          outputs: ["orderCancelled", "inventory"],
        },
      ],
      initialMarking: {
        cartReady: 3,
        inventory: 2,
        inventoryReserved: 0,
        paymentPending: 0,
        paymentComplete: 0,
        paymentFailed: 0,
        orderFulfilled: 0,
        orderCancelled: 0,
      },
    };

    const result = analyse(checkoutNet);

    // Cannot oversell
    const oversold = result.terminalStates.filter(
      (s) => s.orderFulfilled > 2,
    );
    expect(oversold).toHaveLength(0);

    // Every terminal state accounts for all customers
    for (const s of result.terminalStates) {
      const resolved =
        s.orderFulfilled + s.orderCancelled + s.cartReady;
      expect(resolved).toBe(3);
    }
  });
});
