# 架构总览

RayOrch 将用户声明、逻辑执行和 Ray 物理执行分开：

```text
Pipeline.forward()
      │ 符号追踪
      ▼
逻辑图 + 基数/血缘规则
      │ 编译与校验
      ▼
不可变运行计划
      │
      ├─ InputBatchEngine：事实、READY 队列、状态迁移
      ├─ Executor：Actor、RPC、重叠 input batch
      └─ Worker：常驻 UDF 实例与批处理 ABI
```

## 三个私有实现层

```text
rayorch/_program/    追踪分析、lowering、校验、计划
rayorch/_runtime/    input batch 状态、就绪判断、迁移、结果物化
rayorch/_execution/  Ray Actor、对象存储、RPC 生命周期
```

应用代码只应从 `rayorch` 和 `rayorch.benchmark` 导入，不应依赖这些私有模块。

## 清晰的所有权边界

- Compiler 拥有静态拓扑和不变量；
- 每个 `InputBatchEngine` 独占一个源数据切片衍生出的可变语义状态；
- `Executor` 拥有 Actor 容量、待完成 ObjectRef 和物理计数器；
- 每个 Worker Actor 拥有一个常驻 UDF 实例；
- Ray 拥有集群资源、进程放置、传输和 runtime environment。

这种分层使语义运行时可以推理展开与聚合，而不需要把 Ray handle 塞进每个逻辑 Item。
