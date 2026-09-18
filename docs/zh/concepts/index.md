# 编程模型

一个 RayOrch 负载只有两个核心组成：

```text
批量 Python UDF + 一个声明式 Pipeline
```

## UDF 就是普通批处理函数

UDF 可以是带 `run()` 的类，也可以是 callable。每个入参是一列数据，其中一个元素对应一个待执行 Grain；每个输出列必须返回同样数量的行。

```python
class Normalize:
    def __init__(self, prefix=""):
        self.prefix = prefix

    def run(self, texts):
        return [self.prefix + text.strip().lower() for text in texts]
```

重依赖导入和模型构造应放在 UDF 模块或类内部。每个常驻 Actor 拥有一个 UDF 实例。

## `RayModule` 描述一个阶段

```python
self.normalize = (
    ro.RayModule(Normalize)
    .pre_init(prefix="normalized: ")
    .ray_options(replicas=4, batch_size=32, num_cpus=1)
)
```

- `pre_init()` 记录 UDF 构造参数；
- `ray_options()` 记录 `replicas`、RayOrch 的 `batch_size`、`recovery` 以及普通 Ray Actor 选项；
- `.returns(n)` 或 `num_outputs=n` 声明多个输出列。

一个 `RayModule` 在 `forward()` 中每使用一次，就形成一个独立逻辑 **Call** 和独立 Actor 池。

## `Pipeline.forward()` 是声明，不是实际执行

编译时，`forward()` 收到的是符号化 `Port`。它可以连接 Call 和结构操作，但不能根据运行时数据写 `if port`。逐条过滤应使用 `F.filter()`，逐条条件逻辑也可以写进 UDF。普通配置布尔值仍可在 `forward()` 中选择静态图分支。

## 推荐的普通负载目录

只做自己的实验，不需要 Benchmark 框架：

```text
my_workload/
  udfs.py       # 业务和模型代码
  pipeline.py   # 图结构与资源
  run.py        # 加载输入并调用 rayorch.run/Executor
```

先从这三个文件开始。只有实验需要被复用时，才增加配置和 Benchmark 包装。
