# Completion-driven Runtime

## From Ports to Grains

A `Pipeline` is traced once into Calls, Ports, and structural relationships. At runtime, source rows create logical entities. A Call applied to one eligible entity creates a **Grain**—the smallest schedulable unit.

A Grain becomes READY only when every required input is present. Committing an upstream result publishes facts immediately, which may release downstream Grains before the upstream Call has drained.

## Per-Call READY queues

Each Call has persistent actor capacity and a completion-ordered READY queue. The Executor groups READY Grains into an execution microbatch bounded by that Call's `batch_size`, then sends one RPC to an available actor.

A microbatch may contain work from different parent entities, but never mixes different Calls or input batches. Parent identity remains available for lineage, ordered reduction, and group-scoped failure handling.

## Input-batch ownership

`input_batch_size` partitions source rows. Each slice gets one independent semantic engine and owns all entities, facts, Grains, and values derived from those rows. `max_active_input_batches` bounds how many such engines overlap while sharing the same actor pools.

When an input batch finishes, final outputs are materialized and intermediate values are released. This creates an explicit memory and lifetime boundary.

## Structural operations have no actors

`expand`, `filter`, `broadcast`, and `reduce` compile into runtime relationships and transitions. They do not consume an actor slot merely to rearrange lineage.

## Failure and deadlock boundaries

Dropped inputs propagate without invoking downstream UDFs. Failed inputs suppress dependent work according to the compiled contract. Worker exceptions are handled by the Call's bounded recovery policy.

If active input batches have no pending RPC, no dispatchable work, and are not complete, the Executor raises a runtime deadlock error with progress summaries. RayOrch does not silently wait forever for an impossible internal transition. A UDF that itself blocks forever is outside that semantic detector; configure timeouts in external clients/model code and operational limits around the Ray Job.

## Why this design fits AI pipelines

Expensive model stages benefit from persistent actors and batching, while irregular document, video, and agent workloads benefit from fine-grained readiness. Explicit cardinality lets RayOrch combine both without forcing a global stage barrier.
