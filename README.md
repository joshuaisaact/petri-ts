# petri-ts

A small TypeScript Petri net engine. Define places and transitions, fire them, analyse reachable states, or wire up a load/fire/save dispatcher for production use.

## Install

```bash
bun add petri-ts
```

## Quick start

```ts
import { type PetriNet, fire, reachableStates, terminalStates } from "petri-ts";

type Place = "idle" | "running" | "done";

const net: PetriNet<Place> = {
  transitions: [
    { name: "start", inputs: ["idle"], outputs: ["running"] },
    { name: "finish", inputs: ["running"], outputs: ["done"] },
  ],
  initialMarking: { idle: 1, running: 0, done: 0 },
};

let m = net.initialMarking;
m = fire(m, net.transitions[0]); // { idle: 0, running: 1, done: 0 }

reachableStates(net);  // all reachable markings from initialMarking
terminalStates(net);   // markings where nothing can fire
```

## Dispatcher

For the "marking as a JSON column" pattern — one net definition, one row per instance, load/fire/save inside a transaction:

```ts
import { createDispatcher, memoryAdapter } from "petri-ts";

const d = createDispatcher(net, memoryAdapter());
await d.create("order-1");
await d.dispatch("order-1", "start");
const { marking } = await d.inspect("order-1");
```

`memoryAdapter()` is a Map-backed store for tests. In production, write your own `PersistenceAdapter` that wraps your database — the lib doesn't handle locking, your transaction does.

## API

| Function | Description |
|---|---|
| `canFire(marking, transition)` | Check if a transition is enabled |
| `fire(marking, transition)` | Fire a transition, returns new marking |
| `reachableStates(net)` | BFS all reachable markings |
| `terminalStates(net)` | Reachable markings with no enabled transitions |
| `isDeadlockFree(net)` | True if no terminal states exist |
| `enabledTransitions(net, marking)` | Which transitions can fire |
| `checkInvariant(net, weights)` | Verify a weighted token sum is constant |
| `toDot(net, marking?)` | Graphviz DOT output |
| `createDispatcher(net, adapter)` | Load/fire/save dispatcher |
| `memoryAdapter()` | In-memory persistence for tests |

## Dev

```bash
bun test        # vitest
bun run build   # JS bundle + .d.ts
bun run lint    # oxlint
bun run fmt     # oxfmt
```
