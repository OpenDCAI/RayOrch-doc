# Quickstart—Multi-node and Multi-GPU

RayOrch gets multi-node execution from Ray. A Pipeline does not need a separate “distributed version.” Prepare a Ray cluster, declare resources for each stage, and connect to the cluster when running.

This page gives the shortest working path first, followed by production considerations.

## 1. Prerequisites

Before starting, verify that:

- head and worker nodes can communicate;
- compatible Python, Ray, and RayOrch versions are installed;
- model dependencies can be imported on nodes eligible for each stage;
- inputs, models, and output paths are accessible from those nodes;
- Ray can detect the GPUs on every node.

A useful first check on every machine is:

```bash
python -c "import ray, rayorch; print(ray.__version__, rayorch.__version__)"
nvidia-smi
```

## 2. Start the Ray cluster

On the head node:

```bash
ray start --head --port=6379 --dashboard-host=0.0.0.0
```

Note an IP address reachable from the worker nodes, for example `10.0.0.10`.

On every worker node:

```bash
ray start --address="10.0.0.10:6379"
```

Back on the head node, inspect the cluster:

```bash
ray status
```

You should see total cluster CPU/GPU capacity and current resource demand. Adapt ports and network policy to your environment, and do not expose an unauthenticated Dashboard to the public internet.

## 3. Define a GPU actor pool

Create `multi_node.py`:

```python
import ray
import rayorch as ro


class WhereAmI:
    def run(self, values):
        context = ray.get_runtime_context()
        node_id = context.get_node_id()
        gpu_ids = context.get_accelerator_ids().get("GPU", [])
        return [
            {"value": value, "node_id": node_id, "gpu_ids": gpu_ids}
            for value in values
        ]


class GpuPool(ro.Pipeline):
    def __init__(self):
        self.work = ro.RayModule(WhereAmI).ray_options(
            replicas=2,
            batch_size=1,
            num_cpus=1,
            num_gpus=1,
        )

    def forward(self, values):
        return self.work(values)


if __name__ == "__main__":
    pipeline = GpuPool()
    result = pipeline.run(
        ["left", "right"],
        address="auto",
    )
    for output in result.outputs:
        print(output)
```

Run it on the head node after joining the cluster:

```bash
python multi_node.py
```

`address="auto"` connects to the current Ray cluster. The Pipeline creates two persistent actors, each requesting one GPU. Ray chooses their node placement; RayOrch distributes ready data across the actor pool.

If the cluster has two nodes with one available GPU each, resource constraints place the actors on separate nodes. If one node has multiple GPUs, Ray may place both actors there. Use Ray custom resources or placement strategies when node placement must be constrained; do not hard-code hostnames inside a UDF.

## 4. Move a CPU tutorial to multi-node GPUs

A normal Pipeline usually needs only two changes:

```python
self.infer = ro.RayModule(Infer).ray_options(
    replicas=8,
    batch_size=32,
    num_cpus=2,
    num_gpus=1,
)
```

```python
result = pipeline.run(
    inputs,
    address="auto",
    input_batch_size=24,
    max_active_input_batches=3,
)
```

This means:

- create eight inference actors;
- reserve one GPU and two CPUs per actor;
- send up to 32 ready items in one UDF RPC;
- overlap at most three source-input batches.

If resources are unavailable, Ray waits for actor admission instead of silently reducing `replicas`. Estimate the total persistent actor demand across all Pipeline stages.

## 5. Three common multi-node problems

### Workers cannot find the code

Every actor must import its UDF class. Choose one of these approaches:

- install the same project version on every node;
- install from a shared source checkout;
- upload development source through Ray Job `working_dir` / `py_modules`.

See [Ray Jobs and Source Submission](../distributed/ray-jobs.md).

### Workers cannot see models or data

Uploading source does not automatically copy large models and datasets. Use shared paths visible at the same location on every eligible node, or pre-populate node-local caches.

### One stage reserves every GPU

Each RayOrch Call owns an independent persistent actor pool. Two stages configured with `replicas=4, num_gpus=1` require eight GPUs in total, not four. See [Resources, Replicas, and Batching](../distributed/resources.md).

## 6. Direct execution or Ray Job?

- **The driver is already inside the cluster environment**: `python multi_node.py` is simplest;
- **submit remotely from a development machine**: use Ray Jobs for a stable execution boundary;
- **run a standard experiment**: prefer Benchmark `.submit()`, which submits the same configuration and retrieves a standard report.

To stop a manually started cluster, run this on each node:

```bash
ray stop
```

Next, run a [built-in Benchmark](../benchmarks/run.md) with standard configuration and profile artifacts.
