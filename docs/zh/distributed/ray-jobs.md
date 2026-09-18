# Ray Job 与源码提交

Driver 已经位于集群环境中时，直接运行 Python 最简单；需要稳定的远程提交边界时使用 Ray Jobs。

## 稳定集群镜像

如果集群已经安装 RayOrch 和负载依赖：

```python
run = bench.submit("http://ray-head:8265")
report = run.wait(timeout_s=3600)
```

Benchmark API 不强制构建 wheel。

## 从源码目录开发提交

```python
from rayorch.benchmark import LocalSource

run = bench.submit(
    "http://ray-head:8265",
    source=LocalSource(
        project_root="/path/to/RayOrch",
        modules=("/path/to/another-local-module",),
    ),
)
report = run.wait(timeout_s=3600)
```

`LocalSource` 会把项目目录映射到 Ray `working_dir`，可选模块映射到 `py_modules`，并默认保留 workload 声明的依赖安装。若依赖已由各阶段环境维护，可设置 `install_dependencies=False`。

## 共享报告路径

Job 成功后，`BenchmarkRun.wait()` 会读取 `summary.json`。因此报告目录必须同时对远程 Job 和提交端可见。`wait(timeout_s=...)` 只限制客户端等待时间，不会自动停止远程 Job；需要停止时应显式调用 `run.stop()`。
