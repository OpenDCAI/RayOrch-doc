# Results and Failures

## Successful results

`RunResult.outputs` preserves the Pipeline output structure. Successful business values are returned unchanged, including `None` and empty lists.

```python
result = MyPipeline().run(inputs)
print(result.outputs)
print(result.elapsed_s)
print(result.rpc_count)
```

Per-Call metrics include actor count, RPC count, Grain dispatches, requeues, and observed RPC batch sizes. Input-batch metrics include logical entity/item/expansion/Grain counts and released values.

## Business failures returned by a UDF

```python
from rayorch import RecordFailure

class Parse:
    def run(self, rows):
        return [RecordFailure("invalid input") if bad(row) else parse(row) for row in rows]
```

- `RecordFailure(cause)` fails one logical record.
- `GroupFailure(cause)` also suppresses siblings with the same direct parent.

Final non-success values are represented by `OutputIssue`. Check its public `ItemOutcome` instead of parsing diagnostic text.

```python
for output in result.outputs:
    if isinstance(output, ro.OutputIssue):
        print(output.outcome.name, output.cause)
    else:
        consume(output)
```

## Opaque UDF exceptions and recovery

```python
from rayorch import RecoveryPolicy

self.stage = ro.RayModule(Stage).ray_options(
    replicas=2,
    batch_size=16,
    recovery=RecoveryPolicy.retry_batch(max_retries=2),
)
```

Available policies include abort, immediate batch retry, deferred-tail retry, and deferred retry followed by singleton isolation. Infrastructure retries are separately bounded.

RayOrch does not impose a wall-clock timeout on arbitrary user code. Use model/client timeouts inside a UDF when external calls can hang, and use Ray Job wait timeouts for driver-side waiting.
