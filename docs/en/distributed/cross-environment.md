# Cross-environment Stages

Different model engines can require incompatible dependency stacks. RayOrch keeps environment selection local to each Call by using Ray's native `runtime_env` actor option.

```python
self.draft = ro.RayModule(SglangInfer).ray_options(
    replicas=1, batch_size=8, num_gpus=1,
    runtime_env={"conda": "rayorch-sglang"},
)
self.final = ro.RayModule(VllmInfer).ray_options(
    replicas=1, batch_size=8, num_gpus=1,
    runtime_env={"conda": "rayorch-vllm"},
)
```

RayOrch serializes ordinary values between the actors; it does not merge their Python environments.

## Required contents of each environment

Each actor environment needs compatible Python and Ray, RayOrch and the workload module, that stage's backend and CUDA dependencies, and access to the configured model/data paths.

Keep heavyweight backend imports inside UDF construction or `run()`. Then the driver does not need to import both engines merely to construct the Pipeline.

`SglangVllmBench` is the built-in reference. Cross-environment execution is an isolation mechanism, not an automatic environment builder: prepare named Conda environments on every eligible node, or use an appropriate Ray runtime environment strategy for your deployment.
