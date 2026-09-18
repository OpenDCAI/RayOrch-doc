# 运行内置 Benchmark

## 无模型拓扑案例

建议先运行一个不需要数据集和模型依赖的确定性案例：

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

## 真实 MinerU 负载

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

无需修改负载源码，就能覆盖少量高级阶段配置：

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

## 产物

```text
OUTPUT_DIR/.rayorch-benchmark/RUN_ID/
  config.json
  summary.json
  gpu_samples.jsonl
```

`summary.json` 包含报告和输出；`gpu_samples.jsonl` 只是在 Driver 可见 GPU 上进行尽力采样，不代表集群全局监控。远程运行请继续阅读 [Ray Job](../distributed/ray-jobs.md)。
