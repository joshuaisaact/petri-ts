import { describe, it, expect } from "vitest";
import { canFire, fire } from "../src/core";
import type { Marking, Transition } from "../src/core";

type Place = "a" | "b" | "c";

const t: Transition<Place> = { name: "t", inputs: ["a"], outputs: ["b"] };

const initial: Marking<Place> = { a: 1, b: 0, c: 0 };

describe("canFire", () => {
  it("returns true when inputs have tokens", () => {
    expect(canFire(initial, t)).toBe(true);
  });

  it("returns false when inputs are empty", () => {
    expect(canFire({ a: 0, b: 0, c: 0 }, t)).toBe(false);
  });
});

describe("fire", () => {
  it("moves tokens from inputs to outputs", () => {
    const result = fire(initial, t);
    expect(result).toEqual({ a: 0, b: 1, c: 0 });
  });

  it("does not mutate the original marking", () => {
    fire(initial, t);
    expect(initial.a).toBe(1);
  });

  it("throws when transition is not enabled", () => {
    expect(() => fire({ a: 0, b: 0, c: 0 }, t)).toThrow(
      "Cannot fire transition: t",
    );
  });

  it("handles transitions with multiple inputs and outputs", () => {
    const multi: Transition<Place> = {
      name: "multi",
      inputs: ["a", "b"],
      outputs: ["c", "c"],
    };
    const result = fire({ a: 1, b: 1, c: 0 }, multi);
    expect(result).toEqual({ a: 0, b: 0, c: 2 });
  });
});
