# Flash-MinerU 应用

[Flash-MinerU](https://github.com/OpenDCAI/Flash-MinerU) 是当前最完整、最典型的 RayOrch 应用场景。它保留 MinerU 的解析和产物逻辑，同时用 RayOrch 管理 PDF 渲染、VLM/OCR 推理和文档组装之间的流水线重叠。

## 负载形状

PDF 不是一次模型调用，而是 RayOrch 中反复出现的动态基数负载：

```text
PDF ──► 页面 ──► GPU VLM/OCR ──► 有序 Markdown / JSON / 图片
  1          M                  1
```

页面数量由输入决定。不同 PDF 中已经就绪的页面可以共享模型 batch，但每个 PDF 仍保留自己的页序和输出目录。

## 最小调用方式

在负载环境中安装 Flash-MinerU 和推理后端：

```bash
pip install flash-mineru
# 或：pip install "flash-mineru[vllm]"
```

当前维护的流水线通过 `MineruEngine` 暴露：

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

`batch_size` 控制应用一次接收多少个逻辑 PDF，`replicas` 控制常驻模型实例数，`inflight` 控制可以重叠的流水线批次数量。具体值取决于模型显存、GPU 数量和存储吞吐，建议先参考 [Flash-MinerU README](https://github.com/OpenDCAI/Flash-MinerU#-quickstart) 的默认配置。 `inflight` 是 Flash-MinerU 应用层的流水线深度；更底层的 RayOrch Benchmark API 使用 `max_active_input_batches` 控制重叠的输入生命周期。

## RayOrch 负责什么

| 关注点 | RayOrch / Flash-MinerU 的行为 |
| --- | --- |
| 动态基数 | 一个 PDF 通过 `F.expand` 展开成实际页面列表 |
| 模型执行 | 已就绪页面进入常驻 GPU Actor 池 |
| 跨输入组批 | 不同 PDF 的页面可以共享物理模型 batch |
| 结果重建 | 页面结果通过 `F.reduce` 回到所属 PDF 和原始页码 |
| 阶段重叠 | 渲染、VLM/OCR 和组装可以在不同在途批次上并行推进 |
| 产物合同 | 继续输出 MinerU 的 Markdown、版面 JSON 和图片目录 |

RayOrch 负责逻辑关系和就绪规则；Ray 仍负责 Actor 放置、资源、对象传输和集群调度；Flash-MinerU 负责 MinerU 特有的模型与产物逻辑。

## 已报告的结果

Flash-MinerU 当前 README 给出了下面这组单机对比：

| 配置 | 语料 | 结果 |
| --- | --- | --- |
| Flash-MinerU 流水线并行路径 | 368 个 PDF，8 × NVIDIA A100 | 约 **8.5 分钟** |
| 八进程 MinerU 基线 | 相同语料和机器 | 约 **14 分钟** |

在这组配置下约为 **1.7×**。这是特定模型、PDF 集合、存储系统和 GPU 上的实测结果，不是对所有环境的保证。比较版本或硬件时，请重新运行 [Flash-MinerU Benchmark 脚本](https://github.com/OpenDCAI/Flash-MinerU/tree/main/docs)。

## 推荐阅读路径

- 先理解通用模式：[一对多与有序归并](../guide/fan-out-and-reduce.md)。
- 再理解运行时边界：[完成驱动运行时](../architecture/runtime.md)。
- 安装模型依赖前，先运行无依赖拓扑案例：[嵌套文档 Benchmark](document-topology.md)。
- 最后按照 Flash-MinerU 的[快速上手](https://github.com/OpenDCAI/Flash-MinerU#-quickstart)和 [Benchmark 指南](https://github.com/OpenDCAI/Flash-MinerU/blob/main/docs/BENCHMARK.zh.md)运行真实负载。
