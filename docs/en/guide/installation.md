# Installation

## Requirements

- Python 3.11 or 3.12;
- a Ray-compatible environment on the driver and workers;
- access to a Ray cluster only when running remotely.

RayOrch is currently alpha software. Pin the RayOrch and Ray versions used by an experiment.

## Install the package

```bash
pip install rayorch
```

For a source checkout:

```bash
git clone https://github.com/OpenDCAI/RayOrch.git
cd RayOrch
pip install -e .
```

The core package depends on Ray. Heavy workload dependencies such as vLLM, SGLang, Ultralytics, or MinerU are optional and belong to the stages that use them.

## Verify the installation

```bash
python -c "import rayorch; print(rayorch.__version__)"
```

Then continue with [Your First Pipeline](first-pipeline.md). It runs locally and requires no model or GPU.

## Cluster installation rule

Every Python process that imports RayOrch code needs compatible Python, Ray, RayOrch, and workload code. You can satisfy this with a stable environment on every eligible node, or with a Ray Job/runtime environment that uploads source and installs dependencies.

Model and dataset paths are separate from Python packaging. For multi-node execution, use paths visible at the same location from every eligible node.
