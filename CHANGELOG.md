# Changelog

## 0.2.0

### Breaking changes

- **`PersistenceAdapter.save`** now accepts `expectedVersion?: string | null`. Passing `null` means "must not exist" (atomic create). Custom adapter implementations need to handle this.
- **`createDispatcher.create()`** always assigns a version (via `generateVersion()`) even when none is provided. Previously the first `dispatch()` after a version-less `create()` skipped the concurrency check.
- **`toDot()`** now uses index-based IDs (`t0`, `t1`, ...) for transition nodes instead of the transition name. This fixes duplicate transition names producing broken DOT output, but changes the output format.

### Fixed

- `canFire()` now treats missing places as 0 tokens instead of `undefined`, preventing `fire()` from producing `NaN` token counts.
- `create()` uses atomic save (`expectedVersion: null`) instead of a TOCTOU load-then-save check, preventing concurrent creates from silently overwriting each other.
- `reachableStates()` derives state keys from all places across the net (transitions + initialMarking), not just initialMarking keys.
- `escapeDot()` now escapes `<`, `>`, `{`, `}`, and `|` which are special in DOT record/HTML labels.
- Removed dead `?? 0` fallback in `fire()` output accumulation.

### Changed

- Merged `analyse.test.ts` into `analysis.test.ts`, removing duplicate test fixture.
- Updated README: accurate dev commands, optional params in API table.

## 0.1.6

### Fixed

- Improved type safety across the API surface.
- Better DOT escaping for special characters.

## 0.1.5

### Added

- `analyse()` convenience function for all-in-one analysis.
- Dual CJS/ESM build with tsup.

### Fixed

- Handle duplicate inputs in `canFire()` (arc weight > 1).
- Index-based BFS in `reachableStates()` replacing `queue.shift()`.
- Prototype-safe marking copy with `Object.create(null)`.
- Optimistic concurrency via version tracking in dispatcher.
- Off-by-one in BFS limit check.
- DOT injection via unescaped names.
- Unsound cast in `checkInvariant()` weightedSum.

## 0.1.4

### Added

- `reachableStates()` guard against unbounded nets.

## 0.1.0

Initial release — core Petri net engine with `canFire`, `fire`, `reachableStates`, `terminalStates`, `isDeadlockFree`, `enabledTransitions`, `checkInvariant`, `toDot`, `createDispatcher`, and `memoryAdapter`.
