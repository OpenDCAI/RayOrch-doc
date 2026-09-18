# 实验复现

在最终论文命令和结果表发布前，本页先明确可复现性契约。

## 一次可复现运行需要记录什么

Benchmark 配置应包含数据路径和输入数量、模型路径和版本、每阶段副本/GPU 数、模型 batch size、源数据 input batch 参数、runtime environment，以及软件和硬件版本。

RayOrch 会在每个 Benchmark 产物目录写入规范化配置和统一执行指标。完整 Ray 集群配置和外部监控数据也应与这些产物一起保存。

## 推荐流程

1. checkout 实验使用的精确 RayOrch revision；
2. 在每个候选节点准备文档指定环境；
3. 验证共享输入、模型、输出和报告路径；
4. 先运行无依赖拓扑 Benchmark 作为集群 smoke test；
5. 用少量真实模型输入验证输出；
6. 运行完整配置并保留产物目录；
7. 归档 `config.json`、`summary.json`、`gpu_samples.jsonl`、Ray 日志和集群元数据。

## 当前状态

仓库已经提供可运行的负载定义和标准报告。论文专用数据集、完整命令矩阵、期望结果范围和引用信息尚未在本文档中声明，后续必须依据正式 artifact 补充，不能依靠记忆拼接。
