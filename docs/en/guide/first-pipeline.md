# Quickstart—Your First Pipeline

This chapter uses no model, dataset, or GPU. We will build the smallest Pipeline: take a list of integers and apply `+1` twice.

```text
[1, 2, 3] ──► AddOne ──► AddOne ──► [3, 4, 5]
```

After running it, you will know the minimum structure of a RayOrch Pipeline and which parts to replace for your own workload.

## 1. Create the script

Create `first_pipeline.py` and copy the complete example:

```python
import rayorch as ro


class AddOne:
    """A minimal UDF that processes a batch of integers."""

    def run(self, values):
        return [value + 1 for value in values]


class AddTwo(ro.Pipeline):
    def __init__(self):
        self.first = ro.RayModule(AddOne).ray_options(
            replicas=1,
            batch_size=8,
            num_cpus=1,
        )
        self.second = ro.RayModule(AddOne).ray_options(
            replicas=1,
            batch_size=8,
            num_cpus=1,
        )

    def forward(self, values):
        after_first = self.first(values)
        return self.second(after_first)


if __name__ == "__main__":
    pipeline = AddTwo()
    result = pipeline.run([1, 2, 3])
    print(result.outputs)
```

## 2. Run the Pipeline

```bash
python first_pipeline.py
```

Ray may print local runtime logs first. The script should end with:

```text
[3, 4, 5]
```

You have now run a two-stage Pipeline backed by Ray actors.

## 3. Understand each part

### UDF: write only batched business logic

```python
class AddOne:
    def run(self, values):
        return [value + 1 for value in values]
```

`run()` receives a column—a Python list—and the returned list must align item by item with the input.

In a real workload, this can become:

- batched image preprocessing;
- batched model inference;
- batched requests to an external service;
- batched file writing or result assembly.

If model initialization is expensive, load it in the UDF's `__init__()`. That UDF instance stays alive inside a Ray actor and is reused across batches.

### `RayModule`: declare how the UDF executes

```python
self.first = ro.RayModule(AddOne).ray_options(
    replicas=1,
    batch_size=8,
    num_cpus=1,
)
```

| Option | Meaning |
| --- | --- |
| `replicas=1` | create one persistent actor for the stage |
| `batch_size=8` | send at most eight ready items in one Worker call |
| `num_cpus=1` | request one CPU per actor from Ray |

Add `num_gpus=1` for a GPU stage. Other Ray actor options can be declared here as well.

### `forward()`: describe only how data flows

```python
def forward(self, values):
    after_first = self.first(values)
    return self.second(after_first)
```

`forward()` builds a static graph; it does not execute `AddOne.run()` at this point. `values` and `after_first` are symbolic `Port` values expressing that the second stage depends on the first.

### `pipeline.run()`: compile, start, execute, and collect

```python
pipeline = AddTwo()
result = pipeline.run([1, 2, 3])
```

This call:

1. traces and compiles the Pipeline;
2. starts or connects to Ray;
3. creates the stage actors;
4. processes the input;
5. returns a `RunResult`;
6. releases the actors created for this run.

Business outputs are in `result.outputs`; timing and per-stage batch/RPC metrics are also stored in `result`.

## 4. Try changing these three things

### Change the business logic

Replace `value + 1` with your own pure Python processing and leave the rest of the Pipeline unchanged.

### Add parallel replicas

```python
replicas=2
```

RayOrch creates two actors for that stage and shares ready work across them. Make sure the machine or cluster has enough resources.

### Process more input

```python
pipeline = AddTwo()
result = pipeline.run(
    list(range(100)),
    input_batch_size=20,
    max_active_input_batches=2,
)
```

These are different batching controls:

- stage `batch_size=8` limits one UDF call;
- `input_batch_size=20` slices the source into separate lifecycles;
- `max_active_input_batches=2` lets two source batches overlap.

Keep the defaults at first; tune them independently as the workload grows.

## 5. Reuse actors across several runs

`pipeline.run()` is convenient for one finite input and closes its temporary Executor afterward. The equivalent functional form `ro.run(pipeline, inputs)` remains available. If model startup is expensive and the same Pipeline runs repeatedly, use `Executor` directly:

```python
with ro.Executor(AddTwo()) as executor:
    first = executor.run([1, 2])
    second = executor.run([10, 20])

print(first.outputs)   # [3, 4]
print(second.outputs)  # [12, 22]
```

Both calls reuse the same persistent UDF actors.

## Summary

A first Pipeline only needs:

- a batched UDF with `run()`;
- a `Pipeline` that declares stages with `RayModule`;
- a `forward()` method that describes dependencies;
- one `pipeline.run()` call with source data.

The next chapter introduces RayOrch's central dataflow operation: [fan one input out into children and reduce them in order](fan-out-and-reduce.md).
