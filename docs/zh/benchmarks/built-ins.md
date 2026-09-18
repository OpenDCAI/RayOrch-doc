# 内置负载

## 真实模型适配

| Benchmark | 拓扑 | 展示重点 |
| --- | --- | --- |
| `MinerUBench` | PDF → Page → OCR → Document | 动态展开、GPU Actor 池、有序重建 |
| `YoloSamBench` | Image → YOLO → SAM → Save | 两个常驻视觉模型池、多输出阶段 |
| `DualVllmBench` | Prompt → vLLM A → vLLM B | 一条图内的两个常驻 LLM 引擎 |
| `SglangVllmBench` | Prompt → SGLang → vLLM | 每阶段独立 Conda 环境 |

这些案例需要各自后端、兼容 CUDA 栈、模型文件和足够 GPU 资源。

## 无依赖拓扑参考

| Benchmark | 拓扑 |
| --- | --- |
| `DocumentTopologyBench` | 嵌套 Document → Page → TableJob → Page → Document |
| `VideoCaptionTopologyBench` | Video → Frame → Caption → Video |
| `VideoMultimodalTopologyBench` | Audio 与 Frame 两个兄弟子域回到 Video 合并 |

它们是确定性案例，不需要模型和数据集，用于展示调度形状；不是生产级 Docling、VLM、ASR 或视觉适配器。

## 不导入重依赖即可发现

```python
from rayorch.benchmark import available, load

print(available())
Bench = load("document_topology")
report = Bench(output_dir="./results").run()
```

也可以直接导入已注册的公开类：

```python
from rayorch.benchmark import YoloSamBench
```

懒加载注册表本身不会导入模型后端。
