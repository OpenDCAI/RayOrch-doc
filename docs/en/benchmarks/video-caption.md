# Video Caption Topology Benchmark

`VideoCaptionTopologyBench` is the smallest `Video → Frame → Video` reference. Every video expands into ordered frames, READY frames from different videos can share Caption actor batches, and completed captions reduce by source video and frame order into one summary record.

## Topology

```mermaid
flowchart LR
    Video["Video"] --> Decode["DecodeFrames"]
    Decode --> Expand["F.expand"]
    Expand --> Frames["Frame Domain<br/>scheduled across videos"]
    Frames --> Caption["CaptionFrames<br/>batched actor pool"]
    Caption --> Reduce["F.reduce<br/>restore frame order"]
    Reduce --> Summary["SummarizeCaptions"]
    Summary --> Output["one result per Video"]
```

## Run

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
).run(profile=False)
```

The case generates logical videos and frames; it reads no media and loads no VLM.

## Outputs and metrics

Each output contains the video name, ordered frame IDs, and deterministic caption strings. The report adds total `frames`.

## What performance it demonstrates

| Observation | Experiment | Question answered |
| --- | --- | --- |
| frame scheduling throughput | `frames / measured_wall_s` | control-plane rate for a `1 → M → 1` workload |
| cross-video batching | increase `video_count` and active input batches | whether more inputs fill Caption batches more effectively |
| ordered-reduction cost | increase `frames_per_video` | how reduction cost changes with larger child groups |
| Worker/RPC tradeoff | scan `workers` and `batch_size` | whether more actors help when UDF work is lightweight |

Use it to validate data shape and scheduler parameters before integrating a real video model. Its numbers do not represent decode or VLM inference performance.
