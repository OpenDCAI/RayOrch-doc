# Installation

This page covers the two common installation paths. **Choose based on whether you want to use RayOrch or modify RayOrch itself.**

- **User**: write Pipelines or run built-in Benchmarks → install from PyPI;
- **Developer**: inspect internals, debug the framework, or contribute → clone and install in editable mode.

RayOrch requires Python `>=3.11, <4`. Python 3.11 or 3.12 in a dedicated environment is recommended to reduce compatibility problems between Ray and model dependencies.

## Option 1: install as a user

```bash
python -m pip install rayorch
```

The core package installs RayOrch and Ray. Heavy dependencies such as MinerU, vLLM, SGLang, and Ultralytics are not installed by default; prepare them only for workloads that use them.

### Verify the installation

```bash
python -c "import ray, rayorch; print('ray', ray.__version__); print('rayorch', rayorch.__version__)"
```

If both versions are printed, the current Python environment can import Ray and RayOrch.

## Option 2: install for source development

```bash
git clone https://github.com/OpenDCAI/RayOrch.git
cd RayOrch
python -m pip install -e .
```

Editable mode means changes under `rayorch/` take effect without reinstalling the package.

To run tests and development tooling as well:

```bash
python -m pip install -r requirements-dev.txt
```

## Run a minimal check

Create `check_rayorch.py`:

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

Run it:

```bash
python check_rayorch.py
```

The final output should be:

```text
['Ray', 'Orch']
```

Ray may also print local runtime logs during first startup. The check succeeds as long as the script reaches the expected output.

## Installation rules for a cluster

For multi-node execution, the driver and every node eligible to host an actor need two things:

1. **an importable code environment**: compatible Python, Ray, RayOrch, and stage dependencies;
2. **accessible workload paths**: models, inputs, and outputs must be visible from the node that runs the stage.

The simplest production setup uses a consistent environment on every node. During development, a Ray Job can upload local source, and separate stages can declare separate `runtime_env` settings. Large models and datasets should normally live in shared storage or node-local caches rather than being uploaded with Python source.

## Common problems

### `ModuleNotFoundError: rayorch`

Make sure the script uses the same Python environment in which RayOrch was installed:

```bash
which python
python -m pip show rayorch
```

### The driver works, but a worker cannot import the UDF

The driver has the source, but the worker does not. Install the workload on every node or use [Ray Jobs and Source Submission](../distributed/ray-jobs.md).

### The program waits indefinitely for a GPU

Check whether the total `ray_options(num_gpus=...)` demand exceeds cluster capacity, and inspect resource demand with `ray status`. RayOrch does not bypass Ray's resource admission.

After installation, continue with [Your First Pipeline](first-pipeline.md). It requires no model or GPU.
