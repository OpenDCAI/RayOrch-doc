# 编写 Benchmark

一个内置 Benchmark 目录应有意保持精简：

```text
my_benchmark/
  udfs.py        # 批量业务和模型代码
  pipeline.py    # 拓扑与阶段资源
  benchmark.py   # 有类型的用户配置和输入适配
  env.json       # Ray Job 所需依赖
  README.md      # 意义、拓扑、运行方式、结果
  __init__.py    # Python 包标记
```

不需要 workload 专属基类、CLI、runner 或 plugin 对象。

## 1. 编写 UDF

```python
class Infer:
    def __init__(self, model):
        self.model = load_model(model)

    def run(self, inputs):
        return [self.model(value) for value in inputs]
```

## 2. 声明 Pipeline

```python
import rayorch as ro

class MyPipeline(ro.Pipeline):
    def __init__(self, model, workers=2, batch_size=16):
        self.infer = (
            ro.RayModule(Infer)
            .pre_init(model=model)
            .ray_options(replicas=workers, batch_size=batch_size, num_gpus=1)
        )

    def forward(self, values):
        return self.infer(values)
```

## 3. 声明环境

```json
{
  "schema_version": 1,
  "pip": {
    "packages": ["my-model-package"],
    "pip_check": true
  }
}
```

这里只列负载依赖，不放用户数据路径和模型路径。

## 4. 增加一个配置 dataclass

Dataclass 校验用户参数；`run()` 加载输入并委托给 `run_benchmark()`；`submit()` 委托给 `submit_benchmark()`。最短实现可以参考 dependency-free 案例，真实模型负载可以参考 MinerU。

顶层应暴露最常用参数：输入、输出、模型路径，输入数量，副本/GPU 数，模型 batch size，input batch size 和 active input batch 数。少量不常用的阶段实验参数统一放在一个 `stage_options` 映射中，不要把所有 Ray 选项摊平到 dataclass。

## 5. 懒加载注册

在 `rayorch.benchmark.registry` 中登记公开类路径和 `env.json`。注册表只保存字符串，真正 `load()` 时才导入 Benchmark。外部包也可以在自身初始化时调用 `register()`。

## 最重要的取舍

如果只是自己的实验，做到 `udfs.py + pipeline.py + run.py` 就够了。只有当类型化配置、统一报告、懒加载发现或 Ray Job 提交确实有价值时，才增加 Benchmark 包装。
