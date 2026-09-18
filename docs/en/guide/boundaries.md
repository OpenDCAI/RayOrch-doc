# Capabilities and Boundaries

RayOrch is deliberately a small orchestration layer. It coordinates finite, multi-stage AI workloads on Ray; it does not try to replace the execution engines and infrastructure around them.

## What RayOrch provides

- A static, acyclic `Pipeline` that makes stage dependencies explicit.
- Ordinary batched Python UDFs hosted by persistent Ray actors.
- Completion-driven dispatch: downstream work starts as soon as its own inputs are ready.
- Explicit `expand`, `filter`, `broadcast`, and `reduce` operations for cardinality and lineage.
- Per-stage CPU, GPU, replica, batching, and Ray `runtime_env` configuration.
- Multi-node and multi-GPU execution through an existing Ray cluster.
- Bounded recovery policies, failure-aware result reconstruction, and internal deadlock detection.
- Lazy Benchmark registration, configurable runs, Ray Job submission, and reproducible reports.

## What remains the user's or platform's responsibility

- **Models and computation:** vLLM, SGLang, PyTorch, and other engines still perform inference or processing.
- **Cluster operations:** Ray still owns node discovery, placement, transport, and resource accounting.
- **Environment provisioning:** RayOrch selects a stage's `runtime_env`; it does not create matching Conda environments on every node.
- **Data distribution:** model weights, datasets, and output paths must already be reachable from the nodes that use them.
- **External-call timeouts:** RayOrch detects an impossible internal transition, but cannot interrupt arbitrary UDF code that blocks forever. Configure timeouts in model clients and external services.
- **Idempotent side effects:** a recovery policy may invoke a UDF again. Writes to external systems must therefore be idempotent when retries are enabled.

## Workloads outside the current model

The current runtime is designed for finite, row-aligned inputs and a static acyclic graph. It does not currently provide:

- unbounded streaming, windows, or long-running stream checkpoints;
- dynamic graph mutation or feedback loops;
- arbitrary cross-input joins;
- exactly-once guarantees for external side effects;
- automatic construction of backend-specific environments;
- a guarantee that every workload is faster than direct Ray code.

RayOrch is most useful when a workload has several heterogeneous stages, irregular fan-out or fan-in, expensive persistent models, and enough independent work for completion-driven scheduling and batching to overlap effectively.

## Operational timeout model

Three different cases should not be confused:

1. **Internal semantic deadlock:** RayOrch raises an error when active input batches cannot make progress and no RPC is pending.
2. **A blocked UDF or external service:** configure a timeout inside that UDF or client.
3. **Waiting for a submitted Ray Job:** `BenchmarkRun.wait(timeout_s=...)` limits the client wait only. Call `run.stop()` if the remote Job should also be terminated.

This separation keeps the runtime contract explicit instead of pretending one global timeout can safely govern every model and external system.
