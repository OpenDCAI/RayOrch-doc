# Benchmarks and Reusable Experiments

The Benchmark layer turns a workload into a typed, repeatable experiment without changing the Pipeline programming model.

```text
configuration
    │
    ├─ load and validate inputs
    ├─ construct Pipeline
    ├─ run locally or submit as a Ray Job
    └─ emit a standard report
```

Importing `rayorch.benchmark` is lazy: it does not import vLLM, SGLang, MinerU, or other workload dependencies. Constructing a Benchmark stores validated configuration; heavyweight dependencies and models load only when execution starts.

A Benchmark report contains normalized configuration, input/output counts and timing, per-Call actor/RPC/Grain/batch metrics, input-batch lifecycle metrics, best-effort driver resource samples, output values, and artifact paths.

Profiling is intentionally not cluster-wide monitoring. Use Ray Dashboard or your deployment's metrics stack for node/process-level observability.

## When to use which interface

| Situation | Interface |
| --- | --- |
| One-off workload or experiment | UDFs + Pipeline + `run()`/`Executor` |
| Reusable, configurable experiment | Add a Benchmark dataclass |
| Remote repeatable execution | Benchmark `.submit()` via Ray Jobs |
| Stable service or application | Own the application lifecycle; reuse `Executor` where appropriate |
