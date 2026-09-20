# 安装

本节介绍两种常见安装方式。**选择哪一种，取决于你是使用 RayOrch，还是准备修改 RayOrch。**

- **普通用户**：直接编写 Pipeline 或运行内置 Benchmark → 使用 `pip install`；
- **开发者**：阅读源码、调试框架或提交 PR → Clone 仓库后可编辑安装。

RayOrch 要求 Python `>=3.11, <4`。为了减少 Ray 和模型依赖的兼容问题，建议优先使用 Python 3.11 或 3.12，并为实验创建独立环境。

## 方式一：普通用户

```bash
python -m pip install rayorch
```

核心包只安装 RayOrch 和 Ray。MinerU、vLLM、SGLang、Ultralytics 等重依赖不会被默认安装；只有运行对应负载时才需要准备。

### 验证安装

```bash
python -c "import ray, rayorch; print('ray', ray.__version__); print('rayorch', rayorch.__version__)"
```

能够打印两个版本号，说明当前 Python 环境可以导入 Ray 和 RayOrch。

## 方式二：源码开发

```bash
git clone https://github.com/OpenDCAI/RayOrch.git
cd RayOrch
python -m pip install -e .
```

`-e` 表示可编辑安装。之后修改仓库中的 `rayorch/` 源码，不需要反复安装即可生效。

如果还要运行测试和开发工具：

```bash
python -m pip install -r requirements-dev.txt
```

## 运行一个最小检查

新建 `check_rayorch.py`：

```python
import rayorch as ro


class Identity:
    def run(self, values):
        return values


class Check(ro.Pipeline):
    def __init__(self):
        self.identity = ro.RayModule(Identity).ray_options(
            replicas=1,
            batch_size=4,
            num_cpus=1,
        )

    def forward(self, values):
        return self.identity(values)


if __name__ == "__main__":
    result = Check().run(["Ray", "Orch"])
    print(result.outputs)
```

运行：

```bash
python check_rayorch.py
```

最后应看到：

```text
['Ray', 'Orch']
```

Ray 首次启动时可能同时打印本地 runtime 日志；只要脚本最终正常输出即可。

## 多机安装原则

多机运行时，Driver 和所有可能承载 Actor 的节点需要满足两类条件：

1. **代码环境可用**：兼容的 Python、Ray、RayOrch 和该阶段依赖；
2. **业务路径可见**：模型、输入、输出等路径在目标节点上能够访问。

最简单的生产方式是在各节点准备一致的环境。开发阶段也可以通过 Ray Job 上传本地源码，或为不同阶段声明不同的 `runtime_env`。模型和大型数据通常不应随 Python 源码上传，应放在共享存储或节点本地缓存中。

## 常见问题

### `ModuleNotFoundError: rayorch`

确认运行脚本的 Python 与安装时一致：

```bash
which python
python -m pip show rayorch
```

### 本地能运行，Worker 无法导入 UDF

这通常表示 Driver 有源码，但 Worker 没有。请在各节点安装负载代码，或使用 [Ray Job 与源码提交](../distributed/ray-jobs.md)。

### 程序一直等待 GPU

检查 `ray_options(num_gpus=...)` 声明的总资源是否超过集群可用资源，并使用 `ray status` 查看资源需求。RayOrch 不会绕过 Ray 的资源准入。

安装完成后，继续运行[第一个 Pipeline](first-pipeline.md)。该教程不依赖模型和 GPU。
