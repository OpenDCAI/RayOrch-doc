# Architecture Overview

RayOrch separates author intent, logical execution, and physical Ray execution.

```text
Pipeline.forward()
      │ symbolic trace
      ▼
logical graph + cardinality and lineage rules
      │ compile and verify
      ▼
immutable runtime plan
      │
      ├─ InputBatchEngine: facts, READY queues, transitions
      ├─ Executor: actors, RPCs, overlapping input batches
      └─ Worker: persistent UDF instance and batch ABI
```

## Three private implementation layers

```text
rayorch/_program/    trace analysis, lowering, verification, plans
rayorch/_runtime/    input-batch state, readiness, transitions, materialization
rayorch/_execution/  Ray actors, object storage, RPC lifecycle
```

Applications should import from `rayorch` and `rayorch.benchmark`, not these private modules.

## Stable ownership boundaries

- The compiler owns static topology and invariants.
- One `InputBatchEngine` owns all mutable semantic state derived from one source slice.
- The `Executor` owns actor capacity, pending ObjectRefs, and physical counters.
- Each Worker actor owns one persistent UDF instance.
- Ray owns cluster resources, process placement, transport, and runtime environments.

This separation lets the semantic runtime reason about fan-out and fan-in without embedding Ray handles into every logical item.
