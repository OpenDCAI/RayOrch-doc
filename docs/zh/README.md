---
pageLayout: home
externalLinkIcon: false
config:
  -
    type: hero
    full: true
    background: tint-plate
    hero:
      name: RayOrch
      tagline: 像写程序一样构建多模态数据管线，随 Ray 集群扩展。
      text: 构建在 Ray 之上的完成驱动数据流运行时，面向多阶段、多模型 AI 工作负载。
      actions:
        -
          theme: brand
          text: 快速上手
          link: /zh/guide/
        -
          theme: alt
          text: 先看 1 → M → 1
          link: /zh/guide/fan-out-and-reduce.html
        -
          theme: alt
          text: API Reference
          link: /zh/api/
        -
          theme: alt
          text: GitHub →
          link: https://github.com/OpenDCAI/RayOrch
---

## 一分钟了解 RayOrch

很多多模态负载都会重复同一个形状：一个 PDF 变成很多页面，一个视频变成很多帧，或一张图片变成多个区域；模型逐项处理这些子项；最后再把子项组装回一个结果。这就是 `1 → M → 1`。

RayOrch 把这层关系写进 Python。你编写批处理 UDF，声明 `F.expand` 和 `F.reduce`，同时保留父项归属、子项顺序、就绪条件和失败范围；Actor、资源、放置和 RPC 交给 Ray。

```text
PDF ──► 页面 ──► OCR / VLM ──► 文档
视频 ──► 帧 ──► 视觉模型 ──► 摘要
```

## 按你的问题选择阅读路径

- **我想先跑起来：** 从[安装](guide/installation.md)和[第一个 Pipeline](guide/first-pipeline.md)开始。
- **我的数据会改变数量：** 阅读[一对多与有序归并](guide/fan-out-and-reduce.md)和[基数与血缘](concepts/cardinality.md)。
- **我想理解运行时：** 先看[框架设计](architecture/)，再看[运行时架构](architecture/runtime.md)。
- **我想看完整应用：** 先运行[MinerU Benchmark](benchmarks/mineru.md)，再阅读 [Flash-MinerU 应用指南](benchmarks/flash-mineru.md) 和它的[上游仓库](https://github.com/OpenDCAI/Flash-MinerU)。
- **我想得到可复现实验数字：** 使用[Benchmark 总览](benchmarks/)并先阅读[如何解读性能结果](benchmarks/performance.md)。

## 什么保持不变

一个物理 batch 可以混合不同父项的就绪子项，但它只是执行细节，不是事实来源。RayOrch 保存稳定的逻辑血缘，因此 batch 组成、Actor 放置和重试时机变化时，输出仍然属于正确的输入。

如果任务只是一个简单函数、无界流式处理，或依赖全局跨行状态，请先阅读[适用边界](guide/boundaries.md)，再决定是否使用 RayOrch。
