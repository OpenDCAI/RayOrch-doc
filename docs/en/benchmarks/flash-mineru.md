# Flash-MinerU application

[Flash-MinerU](https://github.com/OpenDCAI/Flash-MinerU) is the clearest end-to-end application of the RayOrch programming model today. It keeps MinerU's parsing and output logic, while using a RayOrch pipeline to overlap PDF rendering, VLM/OCR inference, and document assembly.

## The shape of the workload

A PDF is not one model request. It has the same variable-cardinality shape used throughout RayOrch:

```text
PDF ──► pages ──► GPU VLM/OCR ──► ordered Markdown / JSON / images
  1          M                 1
```

The page count depends on the input. Ready pages from different PDFs can share a model batch, while each PDF keeps its own page order and output directory.

## Minimal API

Install Flash-MinerU and its inference backend in the workload environment:

```bash
pip install flash-mineru
# or: pip install "flash-mineru[vllm]"
```

The maintained pipeline is exposed through `MineruEngine`:

```python
from flash_mineru import MineruEngine

engine = MineruEngine(
    model="/shared/models/MinerU2.5-2509-1.2B",
    batch_size=16,
    replicas=8,
    num_gpus_per_replica=0.9,
    save_dir="outputs_mineru",
    inflight=4,
)

outputs = engine.run(["paper-a.pdf", "paper-b.pdf"])
```

`batch_size` controls the logical PDF batch accepted by the application. `replicas` controls the number of persistent model instances, and `inflight` controls how many pipeline batches can overlap. The exact settings depend on model memory, GPU count, and storage throughput; start with the defaults in the [Flash-MinerU README](https://github.com/OpenDCAI/Flash-MinerU#-quickstart). `inflight` is Flash-MinerU's application-level pipeline depth; RayOrch's generic `max_active_input_batches` controls overlapping input lifecycles in the lower-level Benchmark API.

## What RayOrch contributes

| Concern | RayOrch / Flash-MinerU behavior |
| --- | --- |
| Variable cardinality | one PDF expands into its actual page list with `F.expand` |
| Model execution | ready pages are sent to persistent GPU actor pools |
| Cross-input batching | pages from different PDFs can share a physical model batch |
| Reconstruction | page results return to their owning PDF and original index with `F.reduce` |
| Stage overlap | render, VLM/OCR, and assembly can progress on different in-flight batches |
| Output contract | MinerU's Markdown, layout JSON, and image layout remain the application output |

RayOrch owns the logical relation and readiness rules. Ray still owns actor placement, resources, object transport, and cluster scheduling. Flash-MinerU owns the MinerU-specific model and artifact logic.

## Reported result

The current Flash-MinerU README reports this single-host comparison:

| Configuration | Corpus | Result |
| --- | --- | --- |
| Flash-MinerU pipeline-parallel path | 368 PDFs, 8 × NVIDIA A100 | about **8.5 min** |
| Eight-process MinerU baseline | same corpus and host | about **14 min** |

That is roughly **1.7× faster** for this configuration. It is a workload measurement rather than a guarantee for every model, PDF collection, storage system, or GPU. Re-run the [Flash-MinerU benchmark scripts](https://github.com/OpenDCAI/Flash-MinerU/tree/main/docs) when comparing versions or hardware.

## How to use this page

- Learn the generic pattern first: [Fan-out and Ordered Reduction](../guide/fan-out-and-reduce.md).
- Understand the runtime boundary: [Completion-driven Runtime](../architecture/runtime.md).
- Run the dependency-free topology case before installing model dependencies: [Nested Document Benchmark](document-topology.md).
- Then follow Flash-MinerU's own [quickstart](https://github.com/OpenDCAI/Flash-MinerU#-quickstart) and [benchmark guide](https://github.com/OpenDCAI/Flash-MinerU/blob/main/docs/BENCHMARK.md).
