# Ray Jobs and Source Submission

Use direct Python execution when your driver already runs inside the cluster environment. Use Ray Jobs when you want a repeatable remote submission boundary.

## Stable cluster image

If RayOrch and workload dependencies are already installed:

```python
run = bench.submit("http://ray-head:8265")
report = run.wait(timeout_s=3600)
```

No wheel is required by the Benchmark API.

## Development from a source checkout

```python
from rayorch.benchmark import LocalSource

run = bench.submit(
    "http://ray-head:8265",
    source=LocalSource(
        project_root="/path/to/RayOrch",
        modules=("/path/to/another-local-module",),
    ),
)
report = run.wait(timeout_s=3600)
```

`LocalSource` maps the project to Ray `working_dir`, optional modules to `py_modules`, and by default keeps the workload's declared dependency installation. Set `install_dependencies=False` when dependencies are already managed by prepared stage environments.

## Shared artifact path

`BenchmarkRun.wait()` reads `summary.json` after the Job succeeds. Therefore the artifact path must be visible to both the Job and the submitting process. `wait(timeout_s=...)` limits how long the client waits; it does not stop the remote Job automatically. Call `run.stop()` explicitly if desired.
