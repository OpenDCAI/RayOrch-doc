# 内置 Benchmark

内置 Benchmark 已拆分为独立案例页，每一页都包含负载解释、Mermaid 拓扑、可运行配置、输出字段和可观察的性能维度。

## 真实模型负载

- [MinerU PDF](mineru.md)：动态页面展开、跨 PDF GPU 组批和保序文档重建。
- [Panda-70M 视频描述](panda70m.md)：按源视频维护 clip 归属、四个时间位置的 Qwen teacher 和有序源视频聚合。
- [YOLO → SAM](yolo-sam.md)：两个常驻视觉模型池组成的多阶段图片流水线。
- [双 vLLM](dual-vllm.md)：两个常驻 LLM 引擎串联的生成与改写流程。
- [SGLang → vLLM](sglang-vllm.md)：两个推理后端位于不同 Conda 环境的跨环境 Pipeline。

## 无依赖拓扑参考

- [嵌套文档](document-topology.md)：Document → Page → TableJob 的两层展开与归并。
- [视频描述](video-caption.md)：Video → Frame → Video 的基础 `1 → M → 1`。
- [多模态视频](video-multimodal.md)：音频和视觉兄弟分支独立推进后按父 Video 汇合。

完整选择建议见 [Benchmarks 总览](index.md)，指标解释见[解读性能结果](performance.md)。
