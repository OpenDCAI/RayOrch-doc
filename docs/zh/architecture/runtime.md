# 完成驱动运行时

## 从 Port 到 Grain

`Pipeline` 只追踪一次，形成 Call、Port 和结构关系。运行时，源数据行创建逻辑 Entity；某个 Call 应用于一个满足条件的 Entity 时，会产生一个 **Grain**，它是最小可调度单元。

只有所需输入全部存在时，Grain 才进入 READY。上游结果一经提交就立即发布事实，因此可能在整个上游 Call 清空之前释放下游 Grain。

## 每个 Call 的 READY 队列

每个 Call 拥有常驻 Actor 容量和按完成顺序推进的 READY 队列。Executor 将 READY Grain 组合成不超过该 Call `batch_size` 的 execution microbatch，并向空闲 Actor 发送一次 RPC。

一个 microbatch 可以包含来自不同父 Entity 的工作，但不会混合不同 Call 或不同 input batch。父项身份仍用于血缘、有序归约和组范围失败。

## Input batch 所有权

`input_batch_size` 对源数据行进行切片。每个切片拥有独立语义引擎，也拥有由这些行衍生的 Entity、事实、Grain 和值。`max_active_input_batches` 限制有多少个引擎在共享同一批 Actor 池时重叠运行。

一个 input batch 完成后，最终结果被物化，中间值被释放，因此生命周期和内存边界明确。

## 结构操作不创建 Actor

`expand`、`filter`、`broadcast` 和 `reduce` 会编译成运行时关系与状态迁移，不会为了整理血缘额外占用 Actor。

## 失败与死锁边界

DROPPED 输入不会调用下游 UDF；FAILED 输入按编译契约抑制依赖工作；Worker 异常交给该 Call 的有界恢复策略。

如果仍有 active input batch，但没有待完成 RPC、没有可调度工作、也没有完成，Executor 会抛出包含进度摘要的运行时死锁错误，不会对一个不可能发生的内部迁移永远等待。若 UDF 自己永久阻塞，则不属于语义死锁检测范围；应在外部客户端或模型代码中设置超时，并为 Ray Job 设置运维边界。

## 为什么适合 AI Pipeline

昂贵模型阶段需要常驻 Actor 和批处理，不规则的文档、视频和 Agent 负载需要细粒度就绪判断。显式基数让 RayOrch 同时满足两者，而不必使用全局阶段屏障。
