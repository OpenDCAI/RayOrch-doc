# Quickstart—Run a Benchmark

A regular Pipeline answers “how does this workload execute?” A Benchmark adds “how can this experiment be configured, repeated, submitted, and recorded through one stable entry point?”

For a first run, use `DocumentTopologyBench`. It requires no model or dataset and simulates:

```text
Document ─► Page ─► Layout / OCR ─► TableJob ─► Page ─► Document
```

The example contains two levels of fan-out and reduction. It exercises RayOrch's central dataflow behavior without downloading a model.

## 1. Create the script

Create `run_benchmark.py`:

```python
from rayorch.benchmark import DocumentTopologyBench


bench = DocumentTopologyBench(
    output_dir="./results",
    document_count=2,
    pages_per_document=3,
    tables_per_page=2,
    workers=2,
    batch_size=4,
    input_batch_size=1,
    max_active_input_batches=2,
)

report = bench.run(profile=False)
report.print_summary()

print("first output:", report.outputs[0])
print("summary file:", report.artifacts["summary"])
```

## 2. Run it

```bash
python run_benchmark.py
```

The `run_id` and timing vary, but the output should include these key values:

```text
benchmark: document_topology
input_rows: 2
output_rows: 2
pages: 6
tables: 8
first output: {'document': 'document-0', 'pages': (0, 1, 2), 'tables': ((0, 1), (), (0, 1))}
```

`report.print_summary()` prints JSON containing Ray/RayOrch versions, startup and execution time, actor and RPC counts, per-UDF batch statistics, and artifact paths.

## 3. Parameters to change first

| Parameter | What it controls |
| --- | --- |
| `document_count` | number of input documents |
| `pages_per_document` | pages produced by each document |
| `tables_per_page` | TableJobs produced by each page |
| `workers` | actor replicas for the main stages |
| `batch_size` | maximum items in one Worker RPC |
| `input_batch_size` | source documents in one input lifecycle |
| `max_active_input_batches` | input lifecycles that may overlap |
| `output_dir` | root directory for standard reports |

A Benchmark is an ordinary Python dataclass. Change experiment scale through constructor arguments instead of editing Benchmark source.

## 4. Inspect the artifacts

Every run creates its own directory:

```text
results/.rayorch-benchmark/<run-id>/
  config.json
  summary.json
  gpu_samples.jsonl
```

- `config.json`: complete configuration for the run;
- `summary.json`: outputs, timing, actor/RPC counts, and per-UDF execution metrics;
- `gpu_samples.jsonl`: best-effort sampling of GPUs visible to the driver when `profile=True`.

Use `profile=False` for a quick logic check. Keep the default `profile=True` for a real GPU experiment, but note that this is not cluster-wide monitoring; use Ray Dashboard or your monitoring stack for multi-node resource observation.

## 5. Run on an existing Ray cluster

```python
report = bench.run(ray_address="auto")
```

Like a regular Pipeline, this connects to the current cluster. Input, output, and model paths must be visible from the nodes that execute the workload.

To submit remotely from outside the cluster, use the same Benchmark object:

```python
run = bench.submit("http://ray-head:8265")
report = run.wait(timeout_s=300)
```

No wheel is required when RayOrch and workload dependencies are already installed in the cluster. To upload local development source, continue with [Ray Jobs and Source Submission](../distributed/ray-jobs.md).

## 6. Move to the real MinerU workload

After the dependency-free example works, switch to the real model Benchmark:

```python
from rayorch.benchmark import MinerUBench


bench = MinerUBench(
    input_path="/shared/pdfs",
    output_dir="/shared/mineru-output",
    model="/shared/models/MinerU2.5",
    input_limit=100,
    num_gpus=8,
    batch_size=64,
    input_batch_size=24,
    max_active_input_batches=3,
)

report = bench.run(ray_address="auto")
report.print_summary()
```

Advanced per-stage settings can also be overridden without editing workload source:

```python
bench = MinerUBench(
    input_path="/shared/pdfs",
    output_dir="/shared/mineru-output",
    model="/shared/models/MinerU2.5",
    stage_options={
        "render": {"replicas": 4, "num_cpus": 2},
        "ocr": {"batch_size": 32},
        "assemble": {"replicas": 2},
    },
)
```

## Summary

The shortest path for a built-in Benchmark is:

```python
from rayorch.benchmark import SomeBench
report = SomeBench(...).run()
```

Benchmarks do not introduce a second execution model. They package a regular Pipeline, input construction, parameters, profiling, and reports behind a stable entry point. See [Built-in Workloads](built-ins.md) for available cases, and read [Write a Benchmark](write.md) when you want to publish your own experiment.
