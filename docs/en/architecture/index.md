# Architecture: From Pipeline Code to Ray Execution

This page follows one workload from user code to distributed execution. The
goal is not to enumerate internal classes, but to explain why each layer exists,
what state it owns, and where to look in the source when something behaves
unexpectedly.

The central design choice is:

> RayOrch keeps **dataflow semantics on the driver** and delegates **physical
> computation and placement to Ray**.

RayOrch decides which logical piece of work is ready, how fan-out/fan-in
relationships are preserved, and how final results are reconstructed. Ray
decides where actors run, transports RPCs, and stores distributed values.

## The user-facing picture

A RayOrch workload has three small authoring elements:

1. **UDFs** implement batched business computation.
2. **`RayModule` objects** describe how each UDF should be instantiated and
   resourced.
3. **`Pipeline.forward()`** connects symbolic values and declares cardinality
   changes.

```python
from typing import cast
import rayorch as ro


class PdfPipeline(ro.Pipeline):
    def __init__(self):
        self.render = ro.RayModule(RenderPdf).ray_options(
            replicas=2, batch_size=1, num_cpus=1,
        )
        self.ocr = ro.RayModule(OcrPage).ray_options(
            replicas=4, batch_size=32, num_gpus=1,
        )
        self.assemble = ro.RayModule(AssembleDocument).ray_options(
            replicas=2, batch_size=4, num_cpus=1,
        )

    def forward(self, pdfs):
        pages = ro.F.expand(cast(ro.Port, self.render(pdfs)))
        contents = cast(ro.Port, self.ocr(pages))
        return self.assemble(ro.F.reduce(contents))
```

The code looks like ordinary function composition, but `forward()` does not
process a PDF. It runs once with symbolic `Port` objects and produces a static
graph.

```text
root Domain: document

PDF ── render ── group[Page]
                     │ expand
                     ▼
child Domain: page

Page ── OCR ── Content
                     │ reduce, preserving page order
                     ▼
root Domain: document

group[Content] ── assemble ── Document
```

`render`, `ocr`, and `assemble` are compute Calls and receive actor pools.
`expand` and `reduce` are structural relationships interpreted by the runtime;
they do not create actors.

## The complete path through the system

```text
User code
  Pipeline + RayModule + F.*
          │
          │ symbolic trace
          ▼
LogicalProgram
  Calls + Ports + Domains + origins
          │
          │ verify → analyze → canonicalize → lower → verify
          ▼
RuntimePlan
  trigger indexes + actor-pool specs + Worker input/output layouts
          │
          ├──────────────────────────────────────────┐
          ▼                                          ▼
Driver: InputBatchEngine                         Ray cluster
  facts + lineage + transitions               persistent Worker actors
  per-Call READY queues                        batched UDF execution
          │                                          │
          └──────── GrainInvocation / report ─────────┘
                              │
                              ▼
                 ordered output materialization
                              │
                              ▼
                          RunResult
```

There are two important boundaries in this diagram:

- The compiler and semantic runtime are Ray-free. They operate on immutable
  identifiers, plans, and state transitions.
- Only the execution adapter owns Ray actor handles and Ray `ObjectRef`s.

That boundary keeps topology semantics testable without a cluster and prevents
Ray-specific state from leaking into every logical object.

## Phase 1: `forward()` is traced, not executed

Calling `Pipeline.compile()` enters `compile_pipeline()` in
`rayorch/_builder.py`.

The builder:

1. inspects the positional parameters of `forward()` and creates one source
   `Port` for each source column;
2. calls `forward()` with those symbolic Ports;
3. records every `RayModule` call as a `CallSpec`;
4. records every `F.expand`, `F.reduce`, `F.filter`, and `F.broadcast` as a
   typed Port origin;
5. freezes the result into a `LogicalProgram`.

The key public objects are defined in `rayorch/api.py`:

| Object | Meaning during authoring |
| --- | --- |
| `Pipeline` | owns the static graph declaration |
| `RayModule` | a UDF recipe: target, constructor arguments, outputs, resources |
| `Port` | a symbolic handle to one logical data stream |
| `F.*` | explicit structural relationships between Ports |

`RayModule.pre_init(...)` only records constructor arguments. The model or UDF
class is not instantiated while tracing. This is why heavyweight backend setup
belongs in the UDF constructor or `run()` method rather than at module import
time.

A symbolic `Port` deliberately has no Python truth value. Data-dependent
branching such as `if pages:` cannot define a static graph. Use `F.filter` or
put the condition inside a UDF.

## Phase 2: compilation turns intent into an executable contract

`rayorch/_program/compiler.py` has one fixed compilation pipeline:

```text
verify logical graph
        ↓
analyze dependencies, consumers, control demand, and group depth
        ↓
canonicalize transparent broadcast chains
        ↓
lower to RuntimePlan
        ↓
verify the final plan
```

The intermediate models have different responsibilities:

### `LogicalProgram`: what the user declared

Defined in `rayorch/_program/logical.py`, it contains:

- **Calls**: concrete uses of `RayModule` recipes;
- **Ports**: symbolic values and their origins;
- **Domains**: entity-granularity levels such as document and page;
- the source Ports and nested output structure.

It intentionally contains no ready queue, actor handle, or mutable runtime
fact.

### `ProgramAnalysis`: facts derived from the graph

`rayorch/_program/analysis.py` computes reverse consumers, Call outputs,
expansion sources, filter-control demand, and group depth. These facts are
reproducible from the logical graph and therefore do not belong in mutable
runtime state.

### `RuntimePlan`: everything needed during a run

`rayorch/_program/lowering.py` converts logical origins into indexed effects:

- `CallInputEffect`
- `ExpandEffect`
- `FilterEffect`
- `BroadcastEffect`
- `ReduceEffect`

It also compiles each Call's `ActorPoolSpec` and the exact Worker input/output
layout. The resulting `RuntimePlan` in `rayorch/_program/plan.py` is immutable.
At runtime the engine follows these precomputed indexes; it does not rediscover
graph meaning from Python objects.

You can inspect this boundary without starting Ray:

```python
compiled = PdfPipeline().compile()
print(compiled.explain_text())
```

The explanation maps each Port to its Domain, logical inputs, and physical
runtime rule. It is the first useful diagnostic when the compiled topology does
not match the intended one.

## The identities that make irregular data manageable

RayOrch does not represent every value as a bare Python object. It separates
static graph identity, runtime lineage, and physical storage:

| Identity | Example | Purpose |
| --- | --- | --- |
| `CallRef` | OCR call | one compute call site and actor pool |
| `PortRef` | OCR content output | one edge/value role in the static graph |
| `DomainRef` | document or page | one cardinality level |
| `EntityRef` | document 7, page 3 | one logical occurrence inside a Domain |
| `ItemRef` | OCR output for page 3 | intersection of Port and Entity |
| `GrainRef` | run OCR for page 3 | intersection of Call and Entity |

A **Grain** is the smallest schedulable logical invocation. An **Item** is a
logical value or terminal outcome. Keeping these identities separate is what
allows one execution microbatch to contain pages from different documents
without losing their parentage.

There is no ambiguous `Missing` business value. An Item has an explicit terminal
outcome:

- `PRESENT`
- `DROPPED`
- `FAILED`
- `SUPPRESSED`

`None` and an empty list remain valid user values.

## Phase 3: the Executor creates the physical Ray layer

`Executor` in `rayorch/_execution/executor.py` is the only component that
coordinates Ray execution.

During construction it:

1. compiles the Pipeline if necessary;
2. connects to or starts Ray;
3. creates one actor pool for every Call using its `replicas` and remaining
   Ray options;
4. waits for every actor's `ready()` method, so UDF/model initialization has
   completed before processing begins.

Each Ray actor wraps one `Worker` from `rayorch/_execution/worker.py`. The
Worker constructs exactly one persistent UDF instance and exposes a small,
value-oriented batch ABI. It does not receive the whole graph or mutable runtime
state.

```text
Call: OCR
  Actor 0 ── one persistent OcrPage instance
  Actor 1 ── one persistent OcrPage instance
  Actor 2 ── one persistent OcrPage instance
  Actor 3 ── one persistent OcrPage instance
```

Ray's native options determine placement. For example, `num_gpus=1` requests
one GPU per OCR actor, while `runtime_env={"conda": "rayorch-sglang"}` selects
that Call's execution environment.

## Phase 4: one run becomes input batches and facts

`Executor.run()` accepts finite, row-aligned source columns. It divides them
into source slices using `input_batch_size`. Each admitted slice gets exactly
one `InputBatchEngine`.

```text
100 source rows, input_batch_size=20

input batch 0: rows  0..19  ─┐
input batch 1: rows 20..39   │ up to max_active_input_batches overlap
input batch 2: rows 40..59   │
...                          ┘
```

Each engine is the sole writer of all semantic state derived from that slice:
Entities, Items, Expansions, pending Grains, lineage, and READY queues. Multiple
input batches may be active, but they share the Executor's persistent actor
pools.

Source columns and UDF output columns are stored as coarse blocks in Ray's
object store. A `RowBinding` points to one row in a block. Logical state carries
these bindings instead of repeatedly copying the full payload through the
driver.

## Phase 5: fact publication makes work READY

`InputBatchEngine` in `rayorch/_runtime/engine.py` is a single-writer,
event-driven state machine.

When a source or Worker result is published:

1. the engine records the Item, Expansion, or Entity fact;
2. it appends that fact to its local queue;
3. `advance()` follows the precompiled effects triggered by that fact;
4. a Call's Grain becomes `READY` as soon as all required inputs for that
   Entity are `PRESENT`;
5. dropped or failed dependencies are propagated without calling the UDF.

The Grain lifecycle is deliberately small:

```text
WAITING ── all inputs present ──► READY
READY   ── reserve for RPC ─────► IN_FLIGHT
IN_FLIGHT ── report committed ──► SEALED
IN_FLIGHT ── approved retry ────► READY (new generation)
```

`DispatchState` in `rayorch/_runtime/dispatch.py` owns these phases and the
per-Call READY queues. Generation numbers reject stale reports after retries.

## Phase 6: READY Grains become Worker microbatches

The Executor repeatedly looks for an idle actor and READY work for that Call.
It reserves up to the Call's `batch_size` and sends one RPC.

An execution microbatch:

- contains Grains for exactly one Call;
- belongs to exactly one input batch;
- may combine different parent entities;
- preserves each Grain's lineage independently.

The Worker resolves `RowBinding`s, reconstructs nested groups when necessary,
and invokes the UDF once with columns:

```python
# One OCR RPC; pages may belong to different PDFs.
contents = ocr_udf.run([page_a0, page_a1, page_b0, page_c0])
```

The Worker validates that output columns align with the input Grain count,
stores successful values back into coarse Ray object-store blocks, and returns
compact `GrainReport` objects. Business values do not become scheduler state.

## Phase 7: commit immediately unlocks downstream work

When an RPC finishes, the Executor calls
`InputBatchEngine.commit_reports(...)`. The engine first validates the entire
report batch, then commits it in stable Grain order.

Successful output publication can immediately:

- fill an input slot of a downstream Call;
- create child Entities for `expand`;
- settle a `filter`;
- project a parent value through `broadcast`;
- complete an ordered group through `reduce`.

The engine then runs `advance()` to a local fixed point. If that creates READY
Grains and an actor is idle, the next Executor iteration dispatches them. There
is no global stage barrier.

## Case study: the built-in MinerU workload

The real implementation lives in:

```text
rayorch/benchmarks/mineru/
  udfs.py        model and file-processing code
  pipeline.py    topology and per-stage resources
  benchmark.py   user configuration, input loading, reports, submission
  env.json       runtime dependency declaration
```

Its Pipeline is:

```python
def forward(self, pdfs):
    pages = F.expand(self.render(pdfs))
    contents = self.ocr(pages)
    stems = self.metadata(pdfs)
    content_groups, ordered_page_groups = F.reduce_aligned(
        contents,
        pages,
        members=contents,
    )
    return self.assemble(content_groups, ordered_page_groups, stems)
```

This produces two Domains:

```text
document Domain (d0)
  ├─ render(pdf) ───────────────► group[page]
  ├─ metadata(pdf) ─────────────► stem
  │
  └─ expand creates page Domain (d1)
       └─ ocr(page) ────────────► content
             │
             └─ reduce_aligned ─► ordered content/page groups in d0
                                      │
                                      └─ assemble(..., stem) ─► result
```

Suppose PDF A has two pages and PDF B has three:

```text
time ─────────────────────────────────────────────────────────►

render A ── done
             ├─ OCR A/0 ── done
             └─ OCR A/1 ───── done ── reduce A ── assemble A

render B ───────── done
                    ├─ OCR B/0 ───────────── done
                    ├─ OCR B/1 ───── done
                    └─ OCR B/2 ───────────────── done ── assemble B
```

The exact ordering depends on Ray scheduling, but the dependency rule is fixed:
as soon as A's render report is committed, A's page Entities exist and its OCR
Grains may run. RayOrch does not wait for B to render. When all surviving OCR
members for A are terminal, `reduce_aligned` reconstructs A's groups in page
ordinal order. If A's metadata is also ready, `assemble A` can run while B is
still in OCR.

This example shows why all three abstractions are needed:

- **Domain and Entity lineage** preserve PDF/page ownership.
- **Grain readiness** allows early downstream execution.
- **Per-Call actor pools and microbatches** keep expensive models loaded and
  still batch pages across different PDFs.

## Failure and completion paths

The normal data path is complemented by explicit failure paths:

- `RecordFailure` fails one logical record.
- `GroupFailure` fails one record and suppresses siblings sharing its direct
  parent for that Call.
- An exception raised by UDF code fails the whole Worker dispatch and is handled
  by the Call's bounded `RecoveryPolicy`.
- An actor/infrastructure failure may replace the actor and retry within the
  infrastructure retry budget.
- A Worker output-shape violation is a contract error and aborts execution.

An input batch is complete only when admission is closed, no facts or dispatches
remain, every Grain is sealed, and every expected output Item is terminal.
`rayorch/_runtime/materialize.py` then reconstructs the output tree in stable
source/child order. Non-success outputs become `OutputIssue` objects. Physical
bindings are released after materialization.

If an input batch is incomplete but has no pending RPC and no dispatchable work,
the Executor reports a RayOrch runtime deadlock with progress counters. A UDF
that blocks inside an outstanding RPC is different and requires a timeout in
the model client or external service. See [Capabilities and
Boundaries](../guide/boundaries.md).

## Where Benchmark fits

Benchmark is a convenience layer around the same core path, not a second
scheduler:

```text
typed Benchmark dataclass
        │ validate and load inputs
        ▼
construct ordinary Pipeline
        │
        ├─ run_benchmark() ──► Executor ──► BenchmarkReport
        │
        └─ submit() ─────────► Ray Jobs ──► same Benchmark.run()
```

- `rayorch/benchmark/registry.py` stores import strings so discovery stays lazy.
- `rayorch/benchmark/execution.py` wraps `Executor`, profiling, and report
  artifacts.
- `rayorch/benchmark/submission.py` serializes configuration and submits the
  same Benchmark through Ray Jobs.
- `rayorch/benchmarks/<name>/` contains workload-specific UDFs, Pipeline,
  configuration, and environment metadata.

This separation is why users can first write a plain Pipeline and later package
it as a reproducible Benchmark without changing the runtime model.

## Ownership boundaries

| Component | Owns | Does not own |
| --- | --- | --- |
| Compiler | static topology, invariants, RuntimePlan | actors or run state |
| `InputBatchEngine` | one input batch's facts, lineage, transitions | Ray handles or placement |
| `DispatchState` | READY/retry queues and Grain phases | business payload execution |
| `Executor` | actors, pending RPCs, active input batches, counters | graph semantics |
| `Worker` | one persistent UDF and batch ABI validation | scheduling decisions |
| Ray | resources, process placement, RPC transport, object store | RayOrch cardinality semantics |

The control plane is currently driver-local. Ray actors and payload blocks are
distributed, but each input batch's semantic state lives in its
`InputBatchEngine` on the driver. This makes ownership and recovery explicit,
while also defining the current boundary: RayOrch targets finite batch
workloads, not an unbounded distributed streaming control plane.

## Read the source in this order

For a code-level understanding, this order follows the same lifecycle as a
real run:

1. `rayorch/api.py` — public authoring objects.
2. `rayorch/_builder.py` — symbolic tracing.
3. `rayorch/_program/logical.py` — declared graph representation.
4. `rayorch/_program/compiler.py` and `lowering.py` — compilation to
   `RuntimePlan`.
5. `rayorch/_execution/executor.py` — actor pools and the driver event loop.
6. `rayorch/_runtime/engine.py` — fact propagation and cardinality semantics.
7. `rayorch/_runtime/dispatch.py` — Grain queues, phases, retries, and fencing.
8. `rayorch/_execution/worker.py` — batched UDF boundary.
9. `rayorch/_runtime/materialize.py` — ordered public outputs.
10. `rayorch/benchmarks/mineru/` — a complete real-model integration.

Continue with [Completion-driven Runtime](runtime.md) for the lower-level state
and transition model, or [Your First Pipeline](../guide/first-pipeline.md) to
build the smallest runnable workload.
