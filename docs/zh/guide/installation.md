# 安装

## 环境要求

- Python 3.11 或 3.12；
- Driver 与 Worker 上可兼容的 Ray 环境；
- 只有远程运行时才需要现成的 Ray 集群。

RayOrch 当前仍处于 Alpha 阶段。可复现实验应固定 RayOrch 与 Ray 的版本。

## 安装包

```bash
pip install rayorch
```

从源码开发：

```bash
git clone https://github.com/OpenDCAI/RayOrch.git
cd RayOrch
pip install -e .
```

核心包依赖 Ray。vLLM、SGLang、Ultralytics、MinerU 等重依赖都是可选的，只属于使用它们的具体阶段。

## 验证安装

```bash
python -c "import rayorch; print(rayorch.__version__)"
```

随后进入[第一个 Pipeline](first-pipeline.md)。该示例只用 CPU，不需要模型和数据集。

## 集群环境原则

所有需要导入 RayOrch 代码的 Python 进程，都必须拥有兼容的 Python、Ray、RayOrch 和负载代码。可以在每个节点准备稳定环境，也可以通过 Ray Job/runtime environment 上传源码并安装依赖。

模型和数据路径不属于 Python 打包问题。多机运行时，应使用每个候选节点都能以相同路径访问的共享存储。
