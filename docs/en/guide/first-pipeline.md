# Your First Pipeline

This example adds one twice. It shows the complete RayOrch contract without model dependencies.

```python
import rayorch as ro

class AddOne:
    def run(self, values):
        return [value + 1 for value in values]

class AddTwo(ro.Pipeline):
    def __init__(self):
        self.first = ro.RayModule(AddOne).ray_options(
            replicas=1, batch_size=8, num_cpus=1,
        )
        self.second = ro.RayModule(AddOne).ray_options(
            replicas=1, batch_size=8, num_cpus=1,
        )

    def forward(self, values):
        return self.second(self.first(values))

result = ro.run(AddTwo(), [1, 2, 3])
print(result.outputs)  # [3, 4, 5]
```

## Read it from the inside out

1. `AddOne.run()` receives and returns **columns**—one Python list per input/output.
2. `RayModule(AddOne)` describes a persistent actor pool; it does not instantiate the class while the graph is traced.
3. `forward()` connects symbolic `Port` values into a static graph.
4. `ro.run()` compiles the graph, starts Ray actors, executes the input, returns a `RunResult`, and closes its actors.

## The two kinds of batching

```python
result = ro.run(
    AddTwo(),
    list(range(100)),
    input_batch_size=20,
    max_active_input_batches=2,
)
```

- `input_batch_size=20` slices source rows into independently owned input batches.
- `max_active_input_batches=2` lets two of those lifecycles overlap.
- `ray_options(batch_size=8)` limits one worker RPC for that stage.

They are different controls. A worker microbatch never mixes Grains from different input batches.

## Reuse model actors across runs

`ro.run()` is the simplest finite-run API. Use `Executor` when initialization is expensive and several runs should share the same actors:

```python
with ro.Executor(AddTwo()) as executor:
    first = executor.run([1, 2])
    second = executor.run([10, 20])
```

Next: learn the [programming model](../concepts/) or run on a [Ray cluster](../distributed/).
