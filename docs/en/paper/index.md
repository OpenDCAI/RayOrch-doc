# Paper Overview

The RayOrch paper narrative is organized around one systems question:

> How can a distributed runtime keep expensive model actors busy when an AI workload changes cardinality and different items become ready at different times?

## Motivation

Multi-stage AI workloads combine properties that are awkward for a simple stage barrier: expensive model initialization, batching-dependent throughput, irregular one-to-many work, different completion times, and ordered parent-level reconstruction.

## Core idea

RayOrch combines four elements:

1. ordinary batched Python UDFs;
2. a declarative Pipeline that exposes cardinality and lineage;
3. persistent per-Call Ray actor pools;
4. completion-driven scheduling at Grain granularity.

Ray remains responsible for cluster scheduling. RayOrch supplies the logical dataflow state machine above it.

## Claims the implementation can explain today

The code directly supports discussion of symbolic tracing, an immutable compiled plan, explicit structural relationships, per-Call READY queues, execution microbatches, overlapping input-batch lifecycles, bounded recovery, deterministic result materialization, and lazy Benchmark packaging.

Formal paper title, author list, venue, artifact version, and citation will be added when manuscript metadata is finalized. This page intentionally does not invent them.

## Paper-to-code map

| Paper concept | Main implementation area |
| --- | --- |
| Programming model | `rayorch/api.py`, `rayorch/functional.py`, `rayorch/_builder.py` |
| Logical/cardinality graph | `rayorch/_program/` |
| Completion-driven runtime | `rayorch/_runtime/engine.py` |
| Persistent Ray actors | `rayorch/_execution/` |
| Benchmark framework | `rayorch/benchmark/` |
| Reference workloads | `rayorch/benchmarks/` |
