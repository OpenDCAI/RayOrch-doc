# Write a Benchmark

Keep a built-in Benchmark directory intentionally small:

```text
my_benchmark/
  udfs.py        # batched business/model code
  pipeline.py    # topology and stage resources
  benchmark.py   # typed user configuration and input adapter
  env.json       # dependencies for Ray Jobs
  README.md      # purpose, topology, run command, results
  __init__.py    # package marker
```

There is no workload-specific base class, CLI, runner, or plugin object.

## 1. Write UDFs

```python
class Infer:
    def __init__(self, model):
        self.model = load_model(model)

    def run(self, inputs):
        return [self.model(value) for value in inputs]
```

## 2. Declare the Pipeline

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

## 3. Declare the environment

```json
{
  "schema_version": 1,
  "pip": {
    "packages": ["my-model-package"],
    "pip_check": true
  }
}
```

List workload dependencies, not user datasets or model paths.

## 4. Add one configuration dataclass

The dataclass validates public parameters. `run()` loads inputs and delegates to `run_benchmark()`. `submit()` delegates to `submit_benchmark()`. Refer to the dependency-free built-ins for the shortest implementation and MinerU for a real model example.

Expose common controls—input/output/model paths, input limit, replica/GPU count, model batch size, input batch size, and active input batches. For uncommon per-stage experiments, accept one small `stage_options` mapping rather than flattening every Ray option into the top-level dataclass.

## 5. Register lazily

Register the public class path and `env.json` resource in `rayorch.benchmark.registry`. The registry stores strings and imports the Benchmark only when loaded. External packages can call `register()` during initialization.

## Authoring rule

If the workload is only your own experiment, stop at `udfs.py + pipeline.py + run.py`. Add the Benchmark wrapper only when typed configuration, standard reports, lazy discovery, or Ray Job submission creates real value.
