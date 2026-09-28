---
pageLayout: home
externalLinkIcon: false
config:
  -
    type: hero
    full: true
    background: tint-plate
    hero:
      name: RayOrch
      tagline: Write multimodal data pipelines like programs. Scale them across Ray.
      text: A completion-driven dataflow runtime for multi-stage, multi-model AI workloads on Ray.
      actions:
        -
          theme: brand
          text: Get Started
          link: /en/guide/
        -
          theme: alt
          text: See 1 → M → 1
          link: /en/guide/fan-out-and-reduce.html
        -
          theme: alt
          text: API Reference
          link: /en/api/
        -
          theme: alt
          text: GitHub →
          link: https://github.com/OpenDCAI/RayOrch
---

## RayOrch in one minute

Many multimodal workloads repeat the same shape: one PDF becomes pages, one video becomes frames, or one image becomes regions; a model processes those children; the children are assembled back into one result. This is the `1 → M → 1` pattern.

RayOrch makes that relationship explicit in Python. You write batched UDFs, declare `F.expand` and `F.reduce`, and keep parent ownership, child order, readiness, and failure scope while Ray handles actors, resources, placement, and RPCs.

```text
PDF ──► pages ──► OCR / VLM ──► document
video ──► frames ──► vision model ──► summary
```

## Follow the path that matches your question

- **I want to run code:** start with [Installation](guide/installation.md) and [Your First Pipeline](guide/first-pipeline.md).
- **I need variable-cardinality data:** read [Fan-out and Ordered Reduction](guide/fan-out-and-reduce.md) and [Cardinality and Lineage](concepts/cardinality.md).
- **I need to understand the runtime:** read [Framework Design](architecture/), then [Runtime Architecture](architecture/runtime.md).
- **I want a complete application:** run the [MinerU benchmark](benchmarks/mineru.md), then read the [Flash-MinerU application guide](benchmarks/flash-mineru.md) and its [upstream repository](https://github.com/OpenDCAI/Flash-MinerU).
- **I want reproducible numbers:** use [Benchmarks](benchmarks/) and read [Interpret Performance Results](benchmarks/performance.md) before comparing runs.

## What stays stable

A physical batch can mix ready children from different parents. It is an execution detail, not the source of truth. RayOrch keeps the logical lineage stable so batching, placement, and retry timing can change without changing which output belongs to which input.

Read the [boundaries](guide/boundaries.md) before adopting RayOrch for a single function, an unbounded stream, or an operator that depends on global cross-row state.
