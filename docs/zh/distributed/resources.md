# 资源、副本与批处理

资源应在真正消费它的阶段声明：

```python
self.infer = ro.RayModule(Infer).ray_options(
    replicas=4,
    batch_size=32,
    num_gpus=1,
    num_cpus=2,
)
```

## `replicas`

`replicas` 是 RayOrch 选项，表示这个 Call 创建多少个常驻 Actor。模型通常在 Actor 内初始化一次，并跨多个 RPC 复用。

## Ray Actor 选项

除了 `replicas`、`batch_size`、`recovery`，其他选项都会传给 Ray Actor 的 `.options(...)`。常用项包括 `num_cpus`、`num_gpus`、自定义 `resources` 和 `runtime_env`。若阶段只能放在特定节点，应使用自定义资源约束；实际放置和资源准入仍由 Ray 决定。

## 三个独立的规模参数

| 参数 | 含义 |
| --- | --- |
| `replicas` | 一个 Call 可并行使用的常驻 Actor 数 |
| 阶段 `batch_size` | 单次 Worker RPC 最多包含多少 READY Grain |
| `input_batch_size` | 一个输入生命周期拥有多少源数据行 |

`max_active_input_batches` 限制同时重叠的输入生命周期。Actor 并发、模型 batch 效率和 Driver/运行时状态压力是不同问题，应分别调节。

## GPU 核算

如果两个阶段各自创建一个 `num_gpus=1` 的常驻 Actor，整个 Pipeline 会同时占用两张 GPU。张量并行 Actor 可能一次申请多张卡。估算资源时要统计所有常驻 Actor 池，而不是只看流程图当前执行到的阶段。
