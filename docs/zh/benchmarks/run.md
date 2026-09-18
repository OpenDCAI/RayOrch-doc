# 快速上手—运行 Benchmark

普通 Pipeline 解决“怎样执行负载”；Benchmark 进一步解决“怎样把一次实验做成可配置、可重复、可提交并自动记录结果的入口”。

建议第一次先运行无模型、无数据集依赖的 `DocumentTopologyBench`。它模拟：

```text
Document ─► Page ─► Layout / OCR ─► TableJob ─► Page ─► Document
```

这个例子包含两层展开和聚合，可以检查 RayOrch 的核心数据流能力，但不会下载任何模型。

## 1. 创建脚本

新建 `run_benchmark.py`：

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

## 2. 运行

```bash
python run_benchmark.py
```

输出中的 `run_id` 和耗时每次不同，但你应能看到这些关键结果：

```text
benchmark: document_topology
input_rows: 2
output_rows: 2
pages: 6
tables: 8
first output: {'document': 'document-0', 'pages': (0, 1, 2), 'tables': ((0, 1), (), (0, 1))}
```

`report.print_summary()` 实际输出为 JSON，其中还包括 Ray/RayOrch 版本、启动时间、执行时间、Actor 数、RPC 数、各 UDF 的 batch 统计和产物路径。

## 3. 最先需要调整的参数

| 参数 | 控制什么 |
| --- | --- |
| `document_count` | 输入文档数量 |
| `pages_per_document` | 每篇文档展开出的页面数量 |
| `tables_per_page` | 页面继续展开出的 TableJob 数量 |
| `workers` | 各主要阶段的 Actor 副本数 |
| `batch_size` | 单次 Worker RPC 的最大数据量 |
| `input_batch_size` | 每个输入批次包含多少篇源文档 |
| `max_active_input_batches` | 最多同时活跃多少个输入批次 |
| `output_dir` | 标准报告的根目录 |

Benchmark 是普通 Python dataclass。修改实验规模只需要传构造参数，不需要编辑 Benchmark 源文件。

## 4. 查看报告产物

每次运行会创建独立目录：

```text
results/.rayorch-benchmark/<run-id>/
  config.json
  summary.json
  gpu_samples.jsonl
```

- `config.json`：本次 Benchmark 的完整配置；
- `summary.json`：输出、耗时、Actor/RPC 数和每个 UDF 的执行统计；
- `gpu_samples.jsonl`：开启 `profile=True` 时，尽力记录 Driver 可见 GPU 的采样。

如果只想检查逻辑，可以像教程一样使用 `profile=False`。真实 GPU 实验建议保持默认的 `profile=True`，但该采样不等同于集群级监控；多节点资源观察仍应使用 Ray Dashboard 或监控系统。

## 5. 在已有 Ray 集群上运行

```python
report = bench.run(ray_address="auto")
```

这与普通 Pipeline 一样连接当前集群。输入、输出和模型路径必须在实际执行节点上可见。

从集群外远程提交时，可以使用同一个 Benchmark 对象：

```python
run = bench.submit("http://ray-head:8265")
report = run.wait(timeout_s=300)
```

集群中已经安装 RayOrch 和负载依赖时，不需要构建 wheel。开发阶段如需上传本地源码，请继续阅读 [Ray Job 与源码提交](../distributed/ray-jobs.md)。

## 6. 升级到真实 MinerU 负载

完成无依赖案例后，再替换为真实模型 Benchmark：

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

少量高级配置也可以从外部覆盖，不必修改负载源码：

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

## 本章小结

运行内置 Benchmark 的最短路径是：

```python
from rayorch.benchmark import SomeBench
report = SomeBench(...).run()
```

Benchmark 不引入第二套执行模型；它只是把普通 Pipeline、输入构造、参数、profile 和报告封装成稳定入口。可用负载见[内置负载](built-ins.md)，希望发布自己的实验时再阅读[编写 Benchmark](write.md)。
