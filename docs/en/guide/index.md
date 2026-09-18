# Introduction

A multi-stage AI workload quickly runs into problems that are not visible in a single model call:

- one PDF becomes many pages, and one video becomes many frames;
- stages need different CPU, GPU, or Python environments;
- expensive models must stay loaded instead of restarting for every item;
- pages from different inputs should share a batch without losing ownership;
- downstream work should start for an input that is ready instead of waiting for the whole stage.

Ray answers questions such as where an actor runs, how many GPUs it reserves, and how remote calls are transported. The application still has to maintain the dataflow relationships above.

**RayOrch supplies that missing layer.** Write each stage as a batched UDF, connect the stages in a `Pipeline`, and declare the Ray resources for each stage. RayOrch tracks expansion, ownership, dependencies, and ordered reduction, while Ray performs the physical distributed execution.

```text
PDF ──► Page ──► OCR ──► Document
Video ──► Frame ──► Vision Model ──► Summary
Image ──► Detector ──► Segmenter ──► Result
Prompt ──► Model A ──► Model B ──► Answer
```

## The smallest useful program

A RayOrch workload has three core elements:

1. **UDF**: an ordinary Python class whose `run()` method receives and returns batches;
2. **`RayModule`**: declares a persistent actor pool and its replicas, batch size, and CPU/GPU resources;
3. **`Pipeline`**: connects stages and marks one-to-many or many-to-one relationships.

```python
import rayorch as ro


class AddOne:
    def run(self, values):
        return [value + 1 for value in values]


class MyPipeline(ro.Pipeline):
    def __init__(self):
        self.add = ro.RayModule(AddOne).ray_options(
            replicas=1,
            batch_size=8,
            num_cpus=1,
        )

    def forward(self, values):
        return self.add(values)


result = ro.run(MyPipeline(), [1, 2, 3])
print(result.outputs)  # [2, 3, 4]
```

You do not need to understand the compiler, Domains, Grains, or READY queues on your first pass. Read the example as:

> **Write batched functions → connect them in a Pipeline → assign resources → run.**

## What RayOrch handles

Consider `PDF → pages → OCR → document`:

```text
PDF A ─► A/0 ─┐
       ├► A/1 ─┼─► OCR ─► assemble PDF A in A/0, A/1, A/2 order
       └► A/2 ─┘

PDF B ─► B/0 ─┐
       └► B/1 ─┴─► OCR ─► assemble PDF B in B/0, B/1 order
```

RayOrch:

- remembers the source PDF of every page;
- batches ready pages from different PDFs for better model utilization;
- preserves page order within each PDF;
- assembles A as soon as A is complete, without waiting for B;
- reuses a model already loaded in an OCR actor;
- exposes timing, RPC, batch, and failure information as results or Benchmark reports.

## How it relates to Ray

RayOrch **uses Ray; it does not replace Ray**:

| Component | Main responsibility |
| --- | --- |
| Ray | nodes, resources, actors, RPC, object storage, and cluster scheduling |
| RayOrch | Pipeline dependencies, fan-out/fan-in, lineage, readiness, and result reconstruction |
| vLLM / SGLang / PyTorch, etc. | actual model inference or computation |

You can therefore keep using Ray's native `num_cpus`, `num_gpus`, custom resources, and `runtime_env`. RayOrch organizes them into an explicit and reusable AI dataflow.

## When it is a good fit

RayOrch is most useful when:

- the workload has two or more CPU/GPU stages;
- an input fans out into a variable number of children and later reduces;
- expensive models should live in persistent actors;
- the same graph must run across multiple machines or GPUs without losing lineage;
- an experiment should become a configurable, submit-able, and recorded Benchmark.

For a single function, one model request, or an unbounded streaming workload, plain Python, Ray Tasks/Actors, or a streaming system may be simpler. See [What RayOrch Does—and Does Not Do](boundaries.md) for the complete boundary.

## Recommended learning path

For a first run, follow these pages in order:

1. [Installation](installation.md)
2. [Quickstart—Your First Pipeline](first-pipeline.md)
3. [Quickstart—Fan-out and Ordered Reduction](fan-out-and-reduce.md)
4. [Quickstart—Multi-node and Multi-GPU](multi-node.md)
5. [Quickstart—Run a Benchmark](../benchmarks/run.md)

Read [Framework Design](../architecture/) when you want to understand why the runtime works this way. Move on to the programming model, resources, cross-environment execution, and recovery when building a production workload.
