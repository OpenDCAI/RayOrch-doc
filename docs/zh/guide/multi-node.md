# 快速上手—多机多卡

RayOrch 的多机能力来自 Ray：Pipeline 不需要改写成另一套“分布式版本”。你只要准备 Ray 集群，为各阶段声明资源，并在运行时连接集群。

本章先给出最短可操作流程，再解释生产环境需要注意什么。

## 1. 前提条件

开始前确认：

- Head 和 Worker 节点网络互通；
- 各节点安装兼容的 Python、Ray、RayOrch；
- UDF 使用的模型依赖在对应节点可导入；
- 输入、模型和输出路径在目标节点可访问；
- Ray 能正确识别各节点 GPU。

建议先在每台机器执行：

```bash
python -c "import ray, rayorch; print(ray.__version__, rayorch.__version__)"
nvidia-smi
```

## 2. 启动 Ray 集群

在 Head 节点启动：

```bash
ray start --head --port=6379 --dashboard-host=0.0.0.0
```

记下 Head 节点可被其他机器访问的 IP，例如 `10.0.0.10`。

在每台 Worker 节点加入集群：

```bash
ray start --address="10.0.0.10:6379"
```

回到 Head 节点检查：

```bash
ray status
```

你应该能看到集群总 CPU/GPU，以及当前资源需求。端口和网络策略应按实际集群环境配置；不要把未鉴权的 Dashboard 暴露到公网。

## 3. 编写一个 GPU Actor Pool

新建 `multi_node.py`：

```python
import ray
import rayorch as ro


class WhereAmI:
    def run(self, values):
        context = ray.get_runtime_context()
        node_id = context.get_node_id()
        gpu_ids = context.get_accelerator_ids().get("GPU", [])
        return [
            {"value": value, "node_id": node_id, "gpu_ids": gpu_ids}
            for value in values
        ]


class GpuPool(ro.Pipeline):
    def __init__(self):
        self.work = ro.RayModule(WhereAmI).ray_options(
            replicas=2,
            batch_size=1,
            num_cpus=1,
            num_gpus=1,
        )

    def forward(self, values):
        return self.work(values)


if __name__ == "__main__":
    result = ro.run(
        GpuPool(),
        ["left", "right"],
        address="auto",
    )
    for output in result.outputs:
        print(output)
```

在已经加入集群的 Head 节点运行：

```bash
python multi_node.py
```

`address="auto"` 表示连接当前 Ray 集群。这个 Pipeline 会创建两个常驻 Actor，每个 Actor 申请一张 GPU。Ray 决定它们位于哪台节点；RayOrch 将就绪数据分发给 Actor 池。

如果集群只有两个节点且每个节点各有一张可用 GPU，两个 Actor 会被资源约束放到不同节点。若单节点有多张卡，则 Ray 也可能把它们放在同一节点；需要固定位置时，请使用 Ray 的自定义资源或 placement 策略，而不要在 UDF 中硬编码主机名。

## 4. 从 CPU 教程切换到多机 GPU

普通 Pipeline 通常只需改两处：

```python
self.infer = ro.RayModule(Infer).ray_options(
    replicas=8,
    batch_size=32,
    num_cpus=2,
    num_gpus=1,
)
```

```python
result = ro.run(
    pipeline,
    inputs,
    address="auto",
    input_batch_size=24,
    max_active_input_batches=3,
)
```

含义是：

- 创建 8 个推理 Actor；
- 每个 Actor 申请 1 张 GPU 和 2 个 CPU；
- 每次 UDF RPC 最多处理 32 条就绪数据；
- 最多让 3 个输入批次重叠运行。

资源不足时，Ray 会让 Actor 等待，而不是自动减少 `replicas`。请先根据所有 Pipeline 阶段的常驻 Actor 总和估算资源。

## 5. 多机最容易踩的三个坑

### Worker 找不到代码

每个 Actor 都要导入 UDF 类。可以选择：

- 所有节点预装同一版本的项目；
- 使用共享源码目录并正确安装；
- 使用 Ray Job 的 `working_dir` / `py_modules` 上传开发源码。

详见 [Ray Job 与源码提交](../distributed/ray-jobs.md)。

### Worker 看不到模型或数据

源码上传不会自动搬运大型模型和数据集。多机负载应使用各节点同路径可见的共享存储，或在节点启动前完成本地缓存。

### 一个阶段占住了所有 GPU

RayOrch 的每个 Call 都有独立常驻 Actor 池。例如两个阶段分别配置 `replicas=4, num_gpus=1`，整个 Pipeline 需要 8 张 GPU，而不是 4 张。详见[资源、副本与批处理](../distributed/resources.md)。

## 6. 直接运行还是 Ray Job

- **Driver 已经在集群环境中**：直接 `python multi_node.py` 最简单；
- **从开发机远程提交、需要稳定运行边界**：使用 Ray Job；
- **运行标准实验**：优先使用 Benchmark 的 `.submit()`，它会提交同一份配置并读取标准报告。

停止手工启动的集群时，在各节点执行：

```bash
ray stop
```

下一步可以运行一个带标准配置和 profile 产物的[内置 Benchmark](../benchmarks/run.md)。
