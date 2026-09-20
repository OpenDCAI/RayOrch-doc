# 分布式运行

RayOrch 使用 Ray，而不是替代 Ray：

```text
Ray 集群
  ├─ 节点放置与资源核算
  ├─ Actor 生命周期与 RPC 传输
  └─ runtime environment

RayOrch
  ├─ 编译 Pipeline 依赖
  ├─ 跟踪基数与血缘
  ├─ 判断哪个 Grain READY
  ├─ 形成每个 Call 的 execution microbatch
  └─ 重建结果和报告
```

在 `pipeline.run()` 或 `Executor` 中传入 `address="auto"` 即可连接现有集群；等价的函数式入口 `rayorch.run(pipeline, ...)` 仍然保留。Ray 根据每个 Call 声明的资源选项放置常驻 Actor。

## 多机运行契约

1. 每个候选环境都能导入兼容的 RayOrch 和负载代码；
2. 模型、数据、输出和报告路径在各节点一致可见，通常依赖共享存储；
3. 每个阶段诚实声明 CPU、GPU、内存和自定义资源；
4. UDF 需要的网络服务与凭证在 Actor 节点可访问；
5. Head 与 Worker 节点的 Ray 和 Python 版本兼容。

RayOrch 不会在图执行过程中自动复制大型数据集或模型权重。
