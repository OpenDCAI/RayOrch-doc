# 论文导读

RayOrch 的论文叙事围绕一个系统问题展开：

> 当 AI 工作负载会改变基数、不同数据在不同时间就绪时，分布式运行时如何持续利用昂贵的模型 Actor？

## 动机

多阶段 AI 负载具有一些不适合简单阶段屏障的特征：模型初始化昂贵、吞吐依赖批处理、文档/视频/Agent 轨迹会产生不规则一对多任务、不同子项完成时间不同，最终结果还必须保持父子血缘和顺序。

## 核心思路

RayOrch 组合四个元素：

1. 普通批量 Python UDF；
2. 显式表达基数和血缘的声明式 Pipeline；
3. 每个 Call 独立的常驻 Ray Actor 池；
4. Grain 粒度的完成驱动调度。

Ray 继续负责集群资源调度；RayOrch 在其上提供逻辑数据流状态机。

## 当前实现可以支撑的内容

当前代码可以直接解释符号追踪、不可变编译计划、显式结构关系、每个 Call 的 READY 队列、execution microbatch、重叠 input batch、有界恢复、确定性结果物化和懒加载 Benchmark 包装。

正式论文标题、作者、会议、artifact 版本和引用信息将在稿件元数据确定后补充。这里不会虚构这些信息。

## 论文概念到代码

| 论文概念 | 主要实现位置 |
| --- | --- |
| 编程模型 | `rayorch/api.py`、`rayorch/functional.py`、`rayorch/_builder.py` |
| 逻辑与基数图 | `rayorch/_program/` |
| 完成驱动运行时 | `rayorch/_runtime/engine.py` |
| 常驻 Ray Actor | `rayorch/_execution/` |
| Benchmark 框架 | `rayorch/benchmark/` |
| 参考负载 | `rayorch/benchmarks/` |
