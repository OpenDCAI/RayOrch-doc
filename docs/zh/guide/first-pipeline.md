# 快速上手—第一个 Pipeline

本章先不使用模型、数据集或 GPU。我们会构建一条最小流水线：输入一组整数，连续执行两次 `+1`。

```text
[1, 2, 3] ──► AddOne ──► AddOne ──► [3, 4, 5]
```

完成这个例子后，你会知道一个 RayOrch Pipeline 最少需要哪些代码，以及应该从哪里修改成自己的负载。

## 1. 创建脚本

新建 `first_pipeline.py`，复制下面的完整代码：

```python
import rayorch as ro


class AddOne:
    """一个最小 UDF：每次处理一批整数。"""

    def run(self, values):
        return [value + 1 for value in values]


class AddTwo(ro.Pipeline):
    def __init__(self):
        self.first = ro.RayModule(AddOne).ray_options(
            replicas=1,
            batch_size=8,
            num_cpus=1,
        )
        self.second = ro.RayModule(AddOne).ray_options(
            replicas=1,
            batch_size=8,
            num_cpus=1,
        )

    def forward(self, values):
        after_first = self.first(values)
        return self.second(after_first)


if __name__ == "__main__":
    result = ro.run(AddTwo(), [1, 2, 3])
    print(result.outputs)
```

## 2. 运行 Pipeline

```bash
python first_pipeline.py
```

Ray 可能先打印本地 runtime 日志，脚本最后应输出：

```text
[3, 4, 5]
```

这样就完成了一条真正由 Ray Actor 执行的两阶段 Pipeline。

## 3. 逐段理解

### UDF：只写批量业务逻辑

```python
class AddOne:
    def run(self, values):
        return [value + 1 for value in values]
```

`run()` 接收的是一列数据，也就是一个 Python 列表；返回列表中的元素要与输入逐项对应。

在真实负载中，这里可以替换为：

- 批量图片预处理；
- 批量模型推理；
- 批量请求外部服务；
- 批量写文件或整理结果。

模型初始化较重时，可以在 UDF 的 `__init__()` 中加载一次。这个 UDF 实例会常驻在 Ray Actor 中，被多个 batch 复用。

### `RayModule`：声明怎样执行这个 UDF

```python
self.first = ro.RayModule(AddOne).ray_options(
    replicas=1,
    batch_size=8,
    num_cpus=1,
)
```

这三个参数分别表示：

| 参数 | 含义 |
| --- | --- |
| `replicas=1` | 为这个阶段创建 1 个常驻 Actor |
| `batch_size=8` | 一次 Worker 调用最多处理 8 条就绪数据 |
| `num_cpus=1` | 每个 Actor 向 Ray 申请 1 个 CPU |

使用 GPU 时，直接增加 `num_gpus=1`。其他 Ray Actor option 也可以放在这里。

### `forward()`：只描述数据怎样流动

```python
def forward(self, values):
    after_first = self.first(values)
    return self.second(after_first)
```

`forward()` 构建的是静态图，不会在这里真正执行 `AddOne.run()`。其中的 `values` 和 `after_first` 是符号化的 `Port`，用来表达“第二个阶段依赖第一个阶段的输出”。

### `ro.run()`：编译、启动和收集结果

```python
result = ro.run(AddTwo(), [1, 2, 3])
```

一次调用会完成：

1. 追踪并编译 `Pipeline`；
2. 启动或连接 Ray；
3. 创建各阶段 Actor；
4. 执行输入；
5. 返回 `RunResult`；
6. 释放本次创建的 Actor。

业务输出位于 `result.outputs`，执行耗时和各阶段 batch/RPC 统计也保存在 `result` 中。

## 4. 先尝试修改这三处

### 修改业务逻辑

把 `value + 1` 改成你自己的纯 Python 处理，其他代码不动。

### 增加并行副本

```python
replicas=2
```

RayOrch 会为该阶段创建两个 Actor，共享它的就绪任务。确保本机或集群有足够资源。

### 处理更多输入

```python
result = ro.run(
    AddTwo(),
    list(range(100)),
    input_batch_size=20,
    max_active_input_batches=2,
)
```

这里有两层不同的 batch：

- 阶段的 `batch_size=8` 控制一次 UDF 调用最多处理多少条数据；
- `input_batch_size=20` 把源输入切成多个生命周期；
- `max_active_input_batches=2` 允许两个输入批次重叠执行。

刚开始可以保持默认值；数据量增大后再分别调节。

## 5. 需要多次运行时复用 Actor

`ro.run()` 适合一次有限输入。如果模型加载很慢，并且同一 Pipeline 要连续执行多次，可以直接使用 `Executor`：

```python
with ro.Executor(AddTwo()) as executor:
    first = executor.run([1, 2])
    second = executor.run([10, 20])

print(first.outputs)   # [3, 4]
print(second.outputs)  # [12, 22]
```

两个 `run()` 会复用同一组常驻 UDF Actor。

## 本章小结

第一个 Pipeline 只需要：

- 一个带 `run()` 的批量 UDF；
- 一个用 `RayModule` 声明阶段的 `Pipeline`；
- 一个 `forward()` 描述依赖；
- 一次 `ro.run()` 提交输入。

下一章会加入 RayOrch 最关键的数据流能力：[一个输入展开成多个子项，再按原顺序聚合](fan-out-and-reduce.md)。
