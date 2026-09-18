# RayOrch 是什么？

RayOrch 是一个构建在 Ray 之上的**基数感知（cardinality-aware）、完成驱动（completion-driven）数据流运行时**。它适合这样的 AI 工作负载：一个输入会拆成多个子任务，经过多个 CPU/GPU 模型，再按原始父子关系组装成结果。

```text
PDF ──► 页面 ──► OCR ──► 文档
视频 ──► 帧 ──► 视觉模型 ──► 摘要
图片 ──► 检测模型 ──► 分割模型 ──► 结果
Prompt ──► 模型 A ──► 模型 B ──► 最终回答
```

## 它解决什么问题

Ray 已经提供分布式任务、Actor、资源和集群管理，但一个多阶段 AI 应用仍需自行处理：

- 子结果属于哪个原始输入；
- 一对多任务怎样展开、怎样按顺序聚合；
- 每个下游任务到底何时可以运行；
- 如何复用常驻模型 Actor 并进行批处理；
- 失败如何传播并形成最终结果；
- 输入、结果和 Benchmark 报告如何重建。

RayOrch 补上的是这层数据流协调。用户只需编写普通的批量 Python UDF，用声明式 `Pipeline` 连接，并为每个阶段声明 Ray 资源。

## 为什么它可以更早启动下游

传统阶段式执行需要等 A 阶段全部完成后再启动 B。RayOrch 跟踪最小逻辑工作单元 **Grain**。某个 Grain 的全部输入一旦到齐，就会立刻进入对应 Call 的 READY 队列，不必等待其他上游工作结束。

```text
阶段屏障：    A A A A | B B B B | C C C C
完成驱动：    A A ─► B ─► C
                 A ─► B ─► C
```

它之所以能这样做，是因为 Pipeline 明确表达了依赖和基数变化；`expand`、`filter`、`broadcast`、`reduce` 不再藏在任意业务代码里。

## 它不替代什么

RayOrch 不替代 Ray、模型推理框架、环境管理器或共享存储。Ray 继续负责节点、资源和 Actor 调度；vLLM、SGLang、PyTorch 等负责模型计算；RayOrch 把它们组织成一条显式数据流。

## 按目标选择入口

| 你的目标 | 从这里开始 |
| --- | --- |
| 跑通一个小 Pipeline | [安装](installation.md) → [第一个 Pipeline](first-pipeline.md) |
| 理解展开与聚合 | [基数操作](../concepts/cardinality.md) |
| 使用多机多卡 | [分布式运行](../distributed/) |
| 运行已有实验 | [运行 Benchmark](../benchmarks/run.md) |
| 开发自己的负载 | [编程模型](../concepts/) |
| 开发可复用 Benchmark | [编写 Benchmark](../benchmarks/write.md) |
| 理解内部调度 | [运行时架构](../architecture/runtime.md) |
| 判断 RayOrch 是否适合当前负载 | [能力边界](boundaries.md) |
