# Resources, Replicas, and Batching

Resources are declared at the stage where they are consumed:

```python
self.infer = ro.RayModule(Infer).ray_options(
    replicas=4,
    batch_size=32,
    num_gpus=1,
    num_cpus=2,
)
```

## `replicas`

`replicas` is a RayOrch option. It creates that many persistent actors for the Call. A model is normally initialized once per actor and reused for many RPCs.

## Ray actor options

Options other than `replicas`, `batch_size`, and `recovery` are passed to Ray actor `.options(...)`. Common examples include `num_cpus`, `num_gpus`, custom `resources`, and `runtime_env`. Use custom resources when a stage must run only on particular nodes. Ray is the source of truth for placement and admission.

## Three independent scale controls

| Control | Meaning |
| --- | --- |
| `replicas` | concurrent persistent actors for one Call |
| stage `batch_size` | maximum READY Grains in one worker RPC |
| `input_batch_size` | source rows owned by one input-batch lifecycle |

`max_active_input_batches` limits how many input-batch lifecycles overlap. Tune these separately: actor concurrency, model batch efficiency, and driver/runtime state pressure are different concerns.

## GPU accounting

A Pipeline with two concurrent stages that each create one `num_gpus=1` actor reserves two GPUs. A tensor-parallel actor may request multiple GPUs. Count all persistent actor pools, not only the stage currently visible in a sequential diagram.
