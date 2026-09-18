# 第一个 Pipeline

下面的例子连续执行两次加一，不依赖模型即可展示完整使用方式。

```python
import rayorch as ro

class AddOne:
    def run(self, values):
        return [value + 1 for value in values]

class AddTwo(ro.Pipeline):
    def __init__(self):
        self.first = ro.RayModule(AddOne).ray_options(
            replicas=1, batch_size=8, num_cpus=1,
        )
        self.second = ro.RayModule(AddOne).ray_options(
            replicas=1, batch_size=8, num_cpus=1,
        )

    def forward(self, values):
        return self.second(self.first(values))

result = ro.run(AddTwo(), [1, 2, 3])
print(result.outputs)  # [3, 4, 5]
```

## 从内向外理解

1. `AddOne.run()` 接收和返回的是**列**：每个参数和输出都是 Python 列表，每个元素对应一个 Grain。
2. `RayModule(AddOne)` 描述常驻 Actor 池；图追踪阶段不会实例化业务类。
3. `forward()` 用符号化 `Port` 连接出静态图。
4. `ro.run()` 编译图、启动 Actor、执行输入、返回 `RunResult`，最后自动释放 Actor。

## 两类不同的批处理

```python
result = ro.run(
    AddTwo(),
    list(range(100)),
    input_batch_size=20,
    max_active_input_batches=2,
)
```

- `input_batch_size=20`：每 20 个源数据行形成一个独立生命周期；
- `max_active_input_batches=2`：允许两个输入批次重叠运行；
- `ray_options(batch_size=8)`：限制该阶段单次 Worker RPC 的 Grain 数量。

这三个参数解决不同问题。一次 Worker microbatch 不会混合来自不同 input batch 的 Grain。

## 跨多次运行复用模型 Actor

`ro.run()` 适合一次有限输入。模型初始化较重、需要多次运行时直接使用 `Executor`：

```python
with ro.Executor(AddTwo()) as executor:
    first = executor.run([1, 2])
    second = executor.run([10, 20])
```

下一步可以阅读[编程模型](../concepts/)或[连接 Ray 集群](../distributed/)。
