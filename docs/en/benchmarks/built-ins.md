# Built-in Workloads

## Real model adapters

| Benchmark | Topology | What it demonstrates |
| --- | --- | --- |
| `MinerUBench` | PDF → Page → OCR → Document | dynamic fan-out, GPU actor pool, ordered reconstruction |
| `YoloSamBench` | Image → YOLO → SAM → Save | two persistent vision-model pools and multi-output stages |
| `DualVllmBench` | Prompt → vLLM A → vLLM B | two persistent LLM engines in one graph |
| `SglangVllmBench` | Prompt → SGLang → vLLM | per-stage Conda environments |

These require their documented backends, compatible CUDA stacks, model files, and sufficient GPU resources.

## Dependency-free topology references

| Benchmark | Topology |
| --- | --- |
| `DocumentTopologyBench` | nested Document → Page → TableJob → Page → Document |
| `VideoCaptionTopologyBench` | Video → Frame → Caption → Video |
| `VideoMultimodalTopologyBench` | sibling Audio and Frame domains joined at Video |

These cases are deterministic and need no model or dataset. They preserve representative scheduling shapes; they are not production Docling, VLM, ASR, or vision adapters.

## Discover without importing dependencies

```python
from rayorch.benchmark import available, load

print(available())
Bench = load("document_topology")
report = Bench(output_dir="./results").run()
```

Or import a registered public class directly:

```python
from rayorch.benchmark import YoloSamBench
```

The lazy registry ensures the registry itself does not import model backends.
