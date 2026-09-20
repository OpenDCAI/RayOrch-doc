# Public API Overview

Import application APIs from `rayorch`:

| API | Purpose |
| --- | --- |
| `Pipeline` | declare a static dataflow in `forward()` and execute one finite input with `pipeline.run(...)` |
| `RayModule` | declare a UDF, constructor args, outputs, and resources |
| `function` | adapt a callable into a stateless `RayModule` |
| `F.expand`, `F.filter`, `F.broadcast`, `F.reduce` | declare cardinality and lineage |
| `run` | equivalent functional form: `rayorch.run(pipeline, ...)` |
| `Executor` | reuse persistent actor pools across runs |
| `RunResult`, `OutputIssue`, `ItemOutcome` | inspect outputs and run metrics |
| `RecordFailure`, `GroupFailure` | return explicit business failures from UDFs |
| `RecoveryPolicy` | configure bounded per-Call recovery |

Import experiment APIs from `rayorch.benchmark`:

| API | Purpose |
| --- | --- |
| built-in `*Bench` classes | typed Benchmark configurations |
| `available`, `load`, `register` | lazy discovery and registration |
| `BenchmarkReport` | serializable config, metrics, profile, artifacts, outputs |
| `LocalSource` | map a source checkout to Ray runtime environment fields |
| `BenchmarkRun` | status, logs, stop, and wait for a submitted Ray Job |

## Compatibility boundary

Modules named `_program`, `_runtime`, `_execution`, `_model`, and `_protocol` are implementation details. Avoid importing their types from application code. Public APIs remain small so internal scheduling and storage representations can evolve.

For signatures and current behavior, package source and docstrings are authoritative while the project is in alpha.
