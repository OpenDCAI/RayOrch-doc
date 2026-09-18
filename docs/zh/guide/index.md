# 简介

如果你正在搭建一条多阶段 AI 处理链路，代码通常很快会遇到这些问题：

- 一个 PDF 会拆成很多页，一个视频会拆成很多帧；
- 不同阶段分别使用 CPU、GPU，甚至不同 Python 环境；
- 模型需要常驻，不能每处理一条数据就重新加载；
- 页面或视频帧可以跨输入合批，但最终结果不能串错；
- 某个输入已经处理完时，希望下游立刻开始，而不是等待整个阶段结束。

Ray 能解决“把 Actor 放到哪台机器、占几张卡、怎样远程调用”的问题，但上述数据流关系仍然需要业务代码自己维护。

**RayOrch 用来补上这一层。** 你只需要把每个处理阶段写成批量 UDF，用 `Pipeline` 连接它们，并声明每个阶段需要的 Ray 资源。RayOrch 会跟踪数据的展开、归属、依赖和聚合，再把真正的计算交给 Ray 集群。

```text
PDF ──► Page ──► OCR ──► Document
Video ──► Frame ──► Vision Model ──► Summary
Image ──► Detector ──► Segmenter ──► Result
Prompt ──► Model A ──► Model B ──► Answer
```

## 最小使用方式

一个 RayOrch 负载只有三个核心部分：

1. **UDF**：普通 Python 类，`run()` 接收一批输入并返回一批输出；
2. **`RayModule`**：把 UDF 声明成常驻 Actor 池，并配置副本、批大小和 CPU/GPU；
3. **`Pipeline`**：描述各阶段如何连接，以及哪里发生一对多或多对一。

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

第一次阅读时，你不需要先理解编译器、Domain、Grain 或 READY 队列。先把上面的代码理解成：

> **写批量函数 → 用 Pipeline 连起来 → 给阶段分配资源 → 运行。**

## RayOrch 帮你处理什么

以 `PDF → 页面 → OCR → 文档` 为例：

```text
PDF A ─► A/0 ─┐
       ├► A/1 ─┼─► OCR ─► 按 A/0、A/1 的顺序组装 PDF A
       └► A/2 ─┘

PDF B ─► B/0 ─┐
       └► B/1 ─┴─► OCR ─► 按 B/0、B/1 的顺序组装 PDF B
```

RayOrch 会负责：

- 记录每个页面来自哪个 PDF；
- 将不同 PDF 的就绪页面送入同一个 OCR batch，提高模型利用率；
- 保持每个 PDF 内部的页面顺序；
- A 的页面处理完后立即组装 A，不必等待 B；
- 复用 OCR Actor 中已经加载的模型；
- 将执行耗时、RPC、batch 和失败信息整理为结果或 Benchmark 报告。

## 它和 Ray 的关系

RayOrch **使用 Ray，而不是替代 Ray**：

| 组件 | 主要负责 |
| --- | --- |
| Ray | 节点、资源、Actor、RPC、对象存储和集群调度 |
| RayOrch | Pipeline 依赖、展开与聚合、数据归属、就绪判断和结果重建 |
| vLLM / SGLang / PyTorch 等 | 真正的模型推理或计算 |

因此，你仍然可以使用 Ray 原生的 `num_cpus`、`num_gpus`、自定义资源和 `runtime_env`。RayOrch 只把这些能力放进一条更容易描述和复用的 AI 数据流中。

## 什么时候适合使用

RayOrch 更适合：

- 有两个或更多 CPU/GPU 阶段；
- 输入会展开为数量不固定的子项，之后还要聚合；
- 模型初始化昂贵，需要常驻 Actor；
- 希望多机多卡运行，同时保持清晰的数据血缘；
- 希望把一次实验包装成可配置、可提交、可记录结果的 Benchmark。

如果任务只是一个简单函数、单次模型调用，或需要无界流式处理，直接使用 Python、Ray Task/Actor 或其他流系统通常更简单。完整边界见[RayOrch 做什么、不做什么](boundaries.md)。

## 推荐阅读顺序

第一次使用，按下面的顺序走一遍即可：

1. [安装](installation.md)
2. [快速上手—第一个 Pipeline](first-pipeline.md)
3. [快速上手—一对多与有序聚合](fan-out-and-reduce.md)
4. [快速上手—多机多卡](multi-node.md)
5. [快速上手—运行 Benchmark](../benchmarks/run.md)

需要理解“为什么可以这样运行”时，再阅读[框架设计](../architecture/)；需要开发生产负载时，再进入编程模型、资源配置、跨环境和失败恢复章节。
