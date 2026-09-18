# 跨环境阶段

不同模型引擎可能需要不兼容的依赖栈。RayOrch 直接使用 Ray 原生 `runtime_env`，把环境选择放在每个 Call 上。

```python
self.draft = ro.RayModule(SglangInfer).ray_options(
    replicas=1, batch_size=8, num_gpus=1,
    runtime_env={"conda": "rayorch-sglang"},
)
self.final = ro.RayModule(VllmInfer).ray_options(
    replicas=1, batch_size=8, num_gpus=1,
    runtime_env={"conda": "rayorch-vllm"},
)
```

RayOrch 在 Actor 之间传输普通业务值，不会把两个 Python 环境合并。

## 每个环境需要什么

每个 Actor 环境都要有兼容的 Python 和 Ray、RayOrch 与负载模块、该阶段的后端和 CUDA 依赖，以及配置中模型/数据路径的访问能力。

重后端导入应放到 UDF 构造或 `run()` 内。这样 Driver 仅仅构建 Pipeline 时不需要同时导入所有引擎。

`SglangVllmBench` 是内置参考案例。跨环境执行是一种隔离机制，不是自动环境构建器：应在所有候选节点准备好同名 Conda 环境，或采用适合部署方式的 Ray runtime environment 策略。
