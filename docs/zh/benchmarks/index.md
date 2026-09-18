# Benchmark 与可复用实验

Benchmark 层把一个普通负载包装成有类型、可重复运行的实验，但不改变 Pipeline 编程模型。

```text
配置
  │
  ├─ 加载并校验输入
  ├─ 构建 Pipeline
  ├─ 本地运行或通过 Ray Job 提交
  └─ 生成统一报告
```

`rayorch.benchmark` 采用懒加载注册：导入它不会顺带导入 vLLM、SGLang、MinerU 等负载依赖。构造 Benchmark 只保存并校验配置，真正执行时才加载模型和重依赖。

Benchmark 报告包含规范化配置、输入输出数量、耗时、每个 Call 的 Actor/RPC/Grain/batch 指标、input batch 生命周期指标、Driver 侧尽力采集的资源样本、输出值和产物路径。

其中 profile 不是集群级监控。节点和进程级观测应使用 Ray Dashboard 或部署环境的监控系统。

## 什么时候用哪个接口

| 场景 | 推荐接口 |
| --- | --- |
| 一次性负载或个人实验 | UDF + Pipeline + `run()`/`Executor` |
| 需要复用和配置的实验 | 增加 Benchmark dataclass |
| 可重复的远程执行 | Benchmark `.submit()` + Ray Jobs |
| 长期服务或应用 | 自己管理应用生命周期，必要时复用 `Executor` |
