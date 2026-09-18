# Run a Built-in Benchmark

## Zero-model topology example

Start with a deterministic case that needs no dataset or optional model packages:

```python
from rayorch.benchmark import VideoCaptionTopologyBench

report = VideoCaptionTopologyBench(
    output_dir="./results",
    video_count=8,
    frames_per_video=16,
    workers=4,
    batch_size=8,
    input_batch_size=1,
    max_active_input_batches=4,
).run()

report.print_summary()
```

## Real MinerU workload

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
```

Advanced stage options can be changed without editing workload source:

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

## Artifacts

```text
OUTPUT_DIR/.rayorch-benchmark/RUN_ID/
  config.json
  summary.json
  gpu_samples.jsonl
```

`summary.json` contains the report and outputs. `gpu_samples.jsonl` is best-effort sampling from GPUs visible to the driver, not a claim of cluster-wide coverage. For remote execution, continue with [Ray Jobs](../distributed/ray-jobs.md).
