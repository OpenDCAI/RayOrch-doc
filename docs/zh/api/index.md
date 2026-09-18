# 公开 API 总览

应用代码从 `rayorch` 导入：

| API | 用途 |
| --- | --- |
| `Pipeline` | 在 `forward()` 中声明静态数据流 |
| `RayModule` | 声明 UDF、构造参数、输出数和资源 |
| `function` | 把 callable 转为无状态 `RayModule` |
| `F.expand/filter/broadcast/reduce` | 声明基数和血缘 |
| `run` | 自动清理地执行一次有限输入 |
| `Executor` | 跨多次运行复用常驻 Actor 池 |
| `RunResult`、`OutputIssue`、`ItemOutcome` | 查看输出与指标 |
| `RecordFailure`、`GroupFailure` | UDF 显式返回业务失败 |
| `RecoveryPolicy` | 配置每个 Call 的有界恢复 |

实验相关 API 从 `rayorch.benchmark` 导入：

| API | 用途 |
| --- | --- |
| 内置 `*Bench` 类 | 有类型的 Benchmark 配置 |
| `available`、`load`、`register` | 懒加载发现和注册 |
| `BenchmarkReport` | 可序列化的配置、指标、profile、产物和输出 |
| `LocalSource` | 将源码目录映射到 Ray runtime environment |
| `BenchmarkRun` | 查询状态、日志、停止并等待 Ray Job |

## 兼容性边界

`_program`、`_runtime`、`_execution`、`_model`、`_protocol` 都是实现细节。应用代码不应导入其中类型。保持公开 API 小而明确，内部调度和存储表示才能继续演进。

项目仍处于 Alpha 阶段，精确签名与当前行为以包源码和 docstring 为准。
