import { describe, it, expect } from "vitest";
import type { PetriNet } from "../src/core";
import { createDispatcher, memoryAdapter } from "../src/dispatch";

type P = "idle" | "running" | "done";

const net: PetriNet<P> = {
  transitions: [
    { name: "start", inputs: ["idle"], outputs: ["running"] },
    { name: "finish", inputs: ["running"], outputs: ["done"] },
  ],
  initialMarking: { idle: 1, running: 0, done: 0 },
};

describe("createDispatcher", () => {
  it("creates an instance with initial marking", async () => {
    const d = createDispatcher(net, memoryAdapter());
    const marking = await d.create("inst-1");
    expect(marking).toEqual({ idle: 1, running: 0, done: 0 });
  });

  it("dispatches a transition and returns new marking", async () => {
    const d = createDispatcher(net, memoryAdapter());
    await d.create("inst-1");
    const marking = await d.dispatch("inst-1", "start");
    expect(marking).toEqual({ idle: 0, running: 1, done: 0 });
  });

  it("chains multiple dispatches", async () => {
    const d = createDispatcher(net, memoryAdapter());
    await d.create("inst-1");
    await d.dispatch("inst-1", "start");
    const marking = await d.dispatch("inst-1", "finish");
    expect(marking).toEqual({ idle: 0, running: 0, done: 1 });
  });

  it("inspect returns current state", async () => {
    const d = createDispatcher(net, memoryAdapter());
    await d.create("inst-1", "v1");
    await d.dispatch("inst-1", "start");
    const state = await d.inspect("inst-1");
    expect(state.marking).toEqual({ idle: 0, running: 1, done: 0 });
    expect(state.version).toBe("v1");
  });

  it("throws on unknown transition", async () => {
    const d = createDispatcher(net, memoryAdapter());
    await d.create("inst-1");
    await expect(d.dispatch("inst-1", "nope")).rejects.toThrow(
      "Unknown transition: nope",
    );
  });

  it("throws when transition is not enabled", async () => {
    const d = createDispatcher(net, memoryAdapter());
    await d.create("inst-1");
    await expect(d.dispatch("inst-1", "finish")).rejects.toThrow(
      "Cannot fire transition: finish",
    );
  });

  it("throws on unknown instance", async () => {
    const d = createDispatcher(net, memoryAdapter());
    await expect(d.inspect("ghost")).rejects.toThrow("Instance not found");
  });
});
