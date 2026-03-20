import { describe, it, expect } from "vitest";
import { canFire, fire } from "./core";
import type { Marking, Transition } from "./core";

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

  it("returns false when input place is missing from marking", () => {
    const sparse = { b: 0, c: 0 } as Marking<Place>;
    expect(canFire(sparse, t)).toBe(false);
  });

  it("returns false when duplicate inputs require more tokens than available", () => {
    const t2: Transition<Place> = {
      name: "t2",
      inputs: ["a", "a"],
      outputs: ["b"],
    };
    expect(canFire({ a: 1, b: 0, c: 0 }, t2)).toBe(false);
    expect(canFire({ a: 2, b: 0, c: 0 }, t2)).toBe(true);
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

  it("handles duplicate inputs (arc weight > 1)", () => {
    const t2: Transition<Place> = {
      name: "t2",
      inputs: ["a", "a"],
      outputs: ["b"],
    };
    const result = fire({ a: 2, b: 0, c: 0 }, t2);
    expect(result).toEqual({ a: 0, b: 1, c: 0 });
  });

  it("throws when duplicate inputs exceed available tokens", () => {
    const t2: Transition<Place> = {
      name: "t2",
      inputs: ["a", "a"],
      outputs: ["b"],
    };
    expect(() => fire({ a: 1, b: 0, c: 0 }, t2)).toThrow(
      "Cannot fire transition: t2",
    );
  });

  it("never produces negative token counts", () => {
    const t2: Transition<Place> = {
      name: "t2",
      inputs: ["a", "a", "a"],
      outputs: ["b"],
    };
    expect(() => fire({ a: 2, b: 0, c: 0 }, t2)).toThrow();
    const result = fire({ a: 3, b: 0, c: 0 }, t2);
    expect(result.a).toBe(0);
    expect(result.b).toBe(1);
  });
});
