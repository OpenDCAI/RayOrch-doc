# What is RayOrch?

RayOrch is a **cardinality-aware, completion-driven dataflow runtime on Ray**. It is designed for AI workloads where one input may fan out into many pieces, pass through several CPU/GPU models, and then be assembled back into one result.

```text
PDF ──► pages ──► OCR ──► document
Video ──► frames ──► vision model ──► summary
Image ──► detector ──► segmenter ──► saved result
Prompt ──► model A ──► model B ──► final answer
```

## The problem it solves

Ray gives you distributed tasks, actors, resources, and cluster management. A multi-stage AI application still needs application-level coordination:

- which output belongs to which original input;
- how one-to-many work is expanded and reduced in order;
- when each downstream item is ready;
- how persistent model actors are reused and batched;
- how failures become final results;
- how inputs, results, and Benchmark reports are reconstructed.

RayOrch supplies that missing dataflow layer. You write ordinary batched Python UDFs, connect them in a declarative `Pipeline`, and assign Ray resources to each stage.

## Why it can start work earlier

A stage-by-stage executor waits for all work in stage A before starting stage B. RayOrch instead tracks the smallest logical work unit, called a **Grain**. When one Grain has all its inputs, it enters that Call's READY queue immediately—even if other upstream work is still running.

```text
stage barrier:       A A A A | B B B B | C C C C
completion-driven:  A A ─► B ─► C
                       A ─► B ─► C
```

This is possible because the Pipeline explicitly records both dependencies and cardinality changes. `expand`, `filter`, `broadcast`, and `reduce` are not hidden inside user code.

## What RayOrch is not

RayOrch does not replace Ray, model engines, environment managers, or shared storage. Ray continues to schedule resources and actors. vLLM, SGLang, PyTorch, and similar engines perform model computation. RayOrch composes these pieces into one explicit dataflow.

## Choose your path

| Goal | Start here |
| --- | --- |
| Run a small pipeline | [Installation](installation.md) → [First Pipeline](first-pipeline.md) |
| Understand fan-out and fan-in | [Cardinality operations](../concepts/cardinality.md) |
| Use multiple machines or GPUs | [Distributed execution](../distributed/) |
| Run a packaged experiment | [Run a Benchmark](../benchmarks/run.md) |
| Build your own workload | [Programming model](../concepts/) |
| Build a reusable Benchmark | [Write a Benchmark](../benchmarks/write.md) |
| Understand the scheduler | [Runtime architecture](../architecture/runtime.md) |
| Check whether RayOrch fits the workload | [Capabilities and boundaries](boundaries.md) |
