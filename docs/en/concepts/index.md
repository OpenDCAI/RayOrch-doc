# Programming Model

A RayOrch workload has two user-owned pieces:

```text
batched Python UDFs + one declarative Pipeline
```

## UDFs are ordinary batch functions

A UDF is a class with `run()` or any callable. Each argument is a column containing one value per scheduled Grain. Every output column must have the same row count.

```python
class Normalize:
    def __init__(self, prefix=""):
        self.prefix = prefix

    def run(self, texts):
        return [self.prefix + text.strip().lower() for text in texts]
```

Keep heavyweight imports and model construction inside the UDF module or class. RayOrch constructs one UDF instance per persistent actor.

## `RayModule` describes a stage

```python
self.normalize = (
    ro.RayModule(Normalize)
    .pre_init(prefix="normalized: ")
    .ray_options(replicas=4, batch_size=32, num_cpus=1)
)
```

- `pre_init()` records constructor arguments.
- `ray_options()` records `replicas`, RayOrch `batch_size`, `recovery`, and normal Ray actor options.
- `.returns(n)` or `num_outputs=n` declares multiple output columns.

Each use of a `RayModule` inside `forward()` becomes a distinct logical **Call** with its own actor pool.

## `Pipeline.forward()` declares, rather than executes

During compilation, `forward()` receives symbolic `Port` objects. It may compose Calls and structural operations, but it cannot branch on runtime data. Use `F.filter()` for item-level filtering, or put an item-level condition inside a UDF. Normal configuration booleans may still choose a static graph branch in `forward()`.

## Recommended workload layout

A private experiment does not need the Benchmark framework:

```text
my_workload/
  udfs.py       # business/model code
  pipeline.py   # graph and resources
  run.py        # load inputs and call rayorch.run/Executor
```

Start with these three files. Add configuration machinery only when the experiment becomes reusable.
