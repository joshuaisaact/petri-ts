import { describe, it, expect } from "vitest";
import type { PetriNet } from "../src/core";
import { analyse } from "../src/analyse";

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
