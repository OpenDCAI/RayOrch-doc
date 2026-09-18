# 框架设计

这一页回答四个问题：

1. 用户写的 UDF 和 Pipeline 分别负责什么；
2. 一段 Python 代码怎样变成可执行的数据流；
3. RayOrch 和 Ray 各自负责哪一层；
4. 页面、视频帧等子项为什么既能跨输入合批，又能正确回到父输入。

如果你刚完成 Quickstart，先阅读“用户看到的编程模型”和“从用户代码到结果的完整链路”即可。后面的编译、运行时状态和源码路径用于开发、调试或理解论文实现，不是运行第一个 Pipeline 的前置知识。

## 先看整体分层

```text
用户负载层     UDF + Pipeline + 资源参数
                  │
RayOrch 编排层  编译依赖、跟踪展开/聚合、判断何时可运行、重建结果
                  │
Ray 执行层      放置 Actor、分配 CPU/GPU、传输 RPC、保存对象
                  │
计算后端层      Python / PyTorch / vLLM / SGLang / 外部服务
```

| 组件 | 用户是否需要编写 | 作用 |
| --- | --- | --- |
| UDF | 是 | 实现一批数据的业务计算 |
| `RayModule` | 是 | 声明 UDF 的构造方式、副本、batch 和资源 |
| `Pipeline.forward()` | 是 | 连接阶段并表达展开、过滤、广播和聚合 |
| Compiler / Runtime | 否 | 将 Pipeline 变成计划，并按依赖推进每条数据 |
| Ray Worker Actor | 否 | 常驻一个 UDF 实例，真正执行批量调用 |
| Benchmark | 可选 | 把 Pipeline、输入配置、提交和报告包装成可复现实验 |

RayOrch 最核心的架构选择是：

> **数据流语义保留在 Driver，物理计算和资源放置交给 Ray。**

RayOrch 判断哪个逻辑任务已经就绪、如何保留展开与聚合的血缘，以及怎样重建最终结果；Ray 负责 Actor 放置、RPC 传输和分布式对象存储。

## 用户看到的编程模型

一个 RayOrch 工作负载只需要三个主要元素：

1. **UDF**：实现批量业务计算；
2. **`RayModule`**：描述 UDF 如何初始化、需要多少副本和资源；
3. **`Pipeline.forward()`**：连接符号值，并声明基数变化。

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

这段代码看起来像普通函数组合，但 `forward()` 不会真的处理 PDF。它只会用符号化 `Port` 执行一次，得到一张静态数据流图。

```text
根 Domain：document

PDF ── render ── group[Page]
                     │ expand
                     ▼
子 Domain：page

Page ── OCR ── Content
                     │ reduce，保持页面顺序
                     ▼
根 Domain：document

group[Content] ── assemble ── Document
```

`render`、`ocr`、`assemble` 是计算 Call，因此各自拥有 Actor 池。`expand` 和 `reduce` 是运行时解释的结构关系，不会额外创建 Actor。

## 从用户代码到结果的完整链路

```text
用户代码
  Pipeline + RayModule + F.*
          │
          │ 符号追踪
          ▼
LogicalProgram
  Call + Port + Domain + 来源关系
          │
          │ 校验 → 分析 → 规范化 → lowering → 再校验
          ▼
RuntimePlan
  触发索引 + Actor 池规格 + Worker 输入输出布局
          │
          ├──────────────────────────────────────────┐
          ▼                                          ▼
Driver：InputBatchEngine                         Ray 集群
  事实 + 血缘 + 状态迁移                       常驻 Worker Actor
  每个 Call 的 READY 队列                     批量执行 UDF
          │                                          │
          └──────── GrainInvocation / report ─────────┘
                              │
                              ▼
                       按血缘顺序物化结果
                              │
                              ▼
                          RunResult
```

这里有两条重要边界：

- 编译器和语义运行时不依赖 Ray，只处理不可变标识、计划和状态迁移；
- 只有执行适配层持有 Ray Actor handle 和 Ray `ObjectRef`。

因此，大部分拓扑和状态逻辑无需启动集群就能测试，也不会把 Ray 相关对象扩散到每一个逻辑数据项中。

## 阶段一：`forward()` 是追踪，不是执行

调用 `Pipeline.compile()` 后，会进入 `rayorch/_builder.py` 中的
`compile_pipeline()`。

Builder 会：

1. 检查 `forward()` 的位置参数，为每个源数据列创建一个 source `Port`；
2. 把这些符号 Port 传入 `forward()`；
3. 将每次 `RayModule` 调用记录为一个 `CallSpec`；
4. 将每次 `F.expand`、`F.reduce`、`F.filter`、`F.broadcast` 记录为带类型的 Port 来源；
5. 最后冻结为 `LogicalProgram`。

公开对象定义在 `rayorch/api.py`：

| 对象 | 在编排阶段的含义 |
| --- | --- |
| `Pipeline` | 拥有静态数据流声明 |
| `RayModule` | UDF 配方：目标类、构造参数、输出数量和资源 |
| `Port` | 指向逻辑数据流的符号句柄 |
| `F.*` | Port 之间显式的结构关系 |

`RayModule.pre_init(...)` 只记录构造参数，追踪阶段不会实例化 UDF 或加载模型。因此重型后端的导入和初始化应该放在 UDF 构造函数或 `run()` 中，而不是模块顶层。

符号 `Port` 故意不能转成 Python 布尔值。`if pages:` 这种依赖数据内容的分支无法形成静态图；应使用 `F.filter`，或者把条件放入 UDF。

## 阶段二：编译把用户意图变成执行合同

`rayorch/_program/compiler.py` 使用固定编译流程：

```text
校验逻辑图
    ↓
分析依赖、消费者、控制值需求和 group depth
    ↓
规范化透明的 broadcast 链
    ↓
lower 为 RuntimePlan
    ↓
校验最终计划
```

中间表示各自承担不同职责。

### `LogicalProgram`：用户声明了什么

它定义在 `rayorch/_program/logical.py`，包含：

- **Call**：一次具体的 `RayModule` 使用；
- **Port**：静态图中的符号值及其来源；
- **Domain**：document、page 等不同实体粒度；
- source Port 和嵌套的输出结构。

其中没有 READY 队列、Actor handle 或可变运行时事实。

### `ProgramAnalysis`：从图中推导出的事实

`rayorch/_program/analysis.py` 计算反向消费者、每个 Call 的输出、展开来源、Filter 控制值需求和 group depth。这些信息都能从逻辑图重复推导，因此不进入可变运行状态。

### `RuntimePlan`：一次执行需要的完整静态合同

`rayorch/_program/lowering.py` 将逻辑来源转换成预先索引好的 Effect：

- `CallInputEffect`
- `ExpandEffect`
- `FilterEffect`
- `BroadcastEffect`
- `ReduceEffect`

Lowering 还会生成每个 Call 的 `ActorPoolSpec`，以及准确的 Worker 输入输出布局。最终得到的 `RuntimePlan` 位于 `rayorch/_program/plan.py`，它是不可变的。运行时只按这些索引传播事实，不会重新猜测 Python 对象表达的拓扑含义。

无需启动 Ray 就可以查看编译结果：

```python
compiled = PdfPipeline().compile()
print(compiled.explain_text())
```

输出会列出每个 Port 所属的 Domain、逻辑输入和物理执行规则。当实际拓扑与预期不一致时，这是第一处应该查看的信息。

## 一组标识如何表达不规则数据

RayOrch 不把每个值仅仅看作一个裸 Python 对象，而是分开表示静态拓扑、运行时血缘和物理存储：

| 标识 | 示例 | 用途 |
| --- | --- | --- |
| `CallRef` | OCR 调用点 | 一个计算位置及其 Actor 池 |
| `PortRef` | OCR 内容输出 | 静态图中的一种值或边 |
| `DomainRef` | document 或 page | 一个基数层级 |
| `EntityRef` | 第 7 个文档的第 3 页 | Domain 中的一次逻辑实体 |
| `ItemRef` | 第 3 页的 OCR 输出 | Port 与 Entity 的交点 |
| `GrainRef` | 对第 3 页执行 OCR | Call 与 Entity 的交点 |

**Grain** 是最小可调度逻辑任务，**Item** 是逻辑值或终态。正是因为二者分离，一个执行 microbatch 才能安全混合来自不同 PDF 的页面，同时继续保留每一页的父级血缘。

运行时不存在含义模糊的 `Missing` 业务值。每个 Item 有明确终态：

- `PRESENT`
- `DROPPED`
- `FAILED`
- `SUPPRESSED`

因此 `None` 和空列表仍然是合法的业务结果。

## 阶段三：Executor 创建物理 Ray 执行层

`rayorch/_execution/executor.py` 中的 `Executor` 是唯一负责协调 Ray 执行的组件。

构造时它会：

1. 必要时编译 Pipeline；
2. 连接已有 Ray 集群，或启动本地 Ray；
3. 按 `replicas` 和其余 Ray options，为每个 Call 创建 Actor 池；
4. 等待所有 Actor 的 `ready()`，确保 UDF 或模型已初始化后再开始处理。

每个 Ray Actor 包装一个 `rayorch/_execution/worker.py` 中的 `Worker`。Worker 内部只构造一个常驻 UDF 实例，并暴露小而明确的批处理 ABI；它不会拿到整张图或可变运行时状态。

```text
Call：OCR
  Actor 0 ── 一个常驻 OcrPage 实例
  Actor 1 ── 一个常驻 OcrPage 实例
  Actor 2 ── 一个常驻 OcrPage 实例
  Actor 3 ── 一个常驻 OcrPage 实例
```

具体资源放置遵循 Ray 原生参数。例如 `num_gpus=1` 表示每个 OCR Actor 申请一张 GPU；`runtime_env={"conda": "rayorch-sglang"}` 表示该 Call 的 Actor 使用指定 Conda 环境。

## 阶段四：一次运行被切分为 input batch 和事实

`Executor.run()` 接收有限、按行对齐的 source columns，再通过
`input_batch_size` 切成多个源数据片段。每个片段拥有唯一的
`InputBatchEngine`。

```text
100 个输入，input_batch_size=20

input batch 0： 0..19  ─┐
input batch 1：20..39   │ 最多同时重叠 max_active_input_batches 个
input batch 2：40..59   │
...                     ┘
```

每个 Engine 是该片段衍生语义状态的唯一写入者，包括 Entity、Item、Expansion、待满足输入的 Grain、血缘和 READY 队列。多个 input batch 可以同时活跃，但会共享 Executor 创建的常驻 Actor 池。

Source 列和 UDF 输出列会作为较粗粒度的 block 存入 Ray Object Store。
`RowBinding` 只记录某个 block 中的一行。逻辑状态传递这些 binding，而不是让完整业务对象反复经过 Driver。

## 阶段五：发布事实，使 Grain 进入 READY

`rayorch/_runtime/engine.py` 中的 `InputBatchEngine` 是单写、事件驱动的语义状态机。

当 source 或 Worker 结果被发布时：

1. Engine 记录 Item、Expansion 或 Entity 事实；
2. 将事实放入本地队列；
3. `advance()` 根据编译好的 Effect 传播该事实；
4. 某个 Entity 对应的 Call 输入全部为 `PRESENT` 后，其 Grain 立即进入 `READY`；
5. 被丢弃或失败的依赖会直接传播，不需要调用下游 UDF。

Grain 生命周期刻意保持很小：

```text
WAITING ── 输入全部就绪 ──► READY
READY   ── 被 RPC 预留 ───► IN_FLIGHT
IN_FLIGHT ── 提交报告 ────► SEALED
IN_FLIGHT ── 允许重试 ────► READY（generation + 1）
```

`rayorch/_runtime/dispatch.py` 中的 `DispatchState` 拥有这些状态和每个 Call 的 READY 队列。generation fencing 用于拒绝重试后迟到的旧报告。

## 阶段六：READY Grain 组成 Worker microbatch

Executor 会不断寻找空闲 Actor 和该 Call 的 READY 工作，最多取
`batch_size` 个 Grain 组成一次 RPC。

一个 execution microbatch：

- 只包含同一个 Call 的 Grain；
- 只属于一个 input batch；
- 可以混合不同父实体；
- 每个 Grain 的血缘仍然独立保存。

Worker 解析 `RowBinding`，必要时重建嵌套 group，然后以列的形式调用一次 UDF：

```python
# 一次 OCR RPC；其中页面可以来自不同 PDF。
contents = ocr_udf.run([page_a0, page_a1, page_b0, page_c0])
```

Worker 会校验输出列是否与输入 Grain 数量对齐，把成功值重新存成 Ray Object Store block，再返回紧凑的 `GrainReport`。业务值本身不会变成调度器状态。

## 阶段七：一次提交立即释放下游工作

RPC 完成后，Executor 调用 `InputBatchEngine.commit_reports(...)`。Engine 先校验整批报告，再按照稳定的 Grain 顺序提交。

成功结果的发布可能立刻：

- 填满下游 Call 的一个输入槽；
- 为 `expand` 创建子 Entity；
- 完成一次 `filter` 判定；
- 通过 `broadcast` 将父级值映射到子级；
- 通过 `reduce` 恢复一个有序 group。

随后 Engine 调用 `advance()` 传播到局部不动点。如果产生新的 READY Grain 且对应 Actor 空闲，下一轮 Executor 循环就会立即派发，不存在全局 stage barrier。

## 用户案例：内置 MinerU 工作负载

真实实现位于：

```text
rayorch/benchmarks/mineru/
  udfs.py        模型与文件处理逻辑
  pipeline.py    拓扑和每阶段资源
  benchmark.py   用户配置、输入加载、报告与提交
  env.json       运行依赖声明
```

它的 Pipeline 是：

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

这张图产生两个 Domain：

```text
document Domain（d0）
  ├─ render(pdf) ───────────────► group[page]
  ├─ metadata(pdf) ─────────────► stem
  │
  └─ expand 创建 page Domain（d1）
       └─ ocr(page) ────────────► content
             │
             └─ reduce_aligned ─► 回到 d0 的有序 content/page groups
                                      │
                                      └─ assemble(..., stem) ─► result
```

假设 PDF A 有两页，PDF B 有三页：

```text
时间 ─────────────────────────────────────────────────────────►

render A ── 完成
             ├─ OCR A/0 ── 完成
             └─ OCR A/1 ───── 完成 ── reduce A ── assemble A

render B ───────── 完成
                    ├─ OCR B/0 ───────────── 完成
                    ├─ OCR B/1 ───── 完成
                    └─ OCR B/2 ───────────────── 完成 ── assemble B
```

具体先后顺序由 Ray 调度决定，但依赖规则是确定的：A 的 render 报告一提交，A 的 page Entity 就已经存在，对应 OCR Grain 可以立即运行，不需要等待 B 完成 render。A 的所有有效 OCR member 进入终态后，`reduce_aligned` 按页序重建 A 的 group；如果 A 的 metadata 也已就绪，`assemble A` 就可以在 B 仍处于 OCR 时运行。

这个案例说明了三个抽象为什么缺一不可：

- **Domain 与 Entity 血缘**保存 PDF 和页面的归属；
- **Grain 就绪状态**允许下游尽早执行；
- **每个 Call 的 Actor 池和 microbatch**既复用昂贵模型，又能跨 PDF 合批页面。

## 失败与完成路径

正常数据路径之外还有显式失败路径：

- `RecordFailure` 只使一条逻辑记录失败；
- `GroupFailure` 使一条记录失败，并抑制该 Call 下同一直接父实体的 siblings；
- UDF 抛出的异常会使整个 Worker dispatch 失败，由该 Call 的有界 `RecoveryPolicy` 处理；
- Actor 或基础设施失败可以在预算内替换 Actor 并重试；
- Worker 输出形状违反合同属于 contract error，会中止执行。

一个 input batch 只有在以下条件全部满足时才算完成：admission 已关闭、没有待传播事实或待执行任务、所有 Grain 均已 sealed，并且每个预期输出 Item 都已进入终态。随后 `rayorch/_runtime/materialize.py` 按 source 和 child ordinal 的稳定顺序重建输出树；非成功结果转换为 `OutputIssue`，物理 binding 在物化后释放。

如果 input batch 尚未完成，但既没有 pending RPC，也没有可派发工作，Executor 会报告 RayOrch 内部死锁并附带进度计数。若 UDF 卡在一个尚未返回的 RPC 内，则属于另一类问题，需要在模型客户端或外部服务中配置超时。详见[能力边界](../guide/boundaries.md)。

## Benchmark 位于架构的哪一层

Benchmark 是同一条核心执行链路外面的便利层，不是第二套调度器：

```text
有类型的 Benchmark dataclass
        │ 校验配置并读取输入
        ▼
构造普通 Pipeline
        │
        ├─ run_benchmark() ──► Executor ──► BenchmarkReport
        │
        └─ submit() ─────────► Ray Jobs ──► 同一个 Benchmark.run()
```

- `rayorch/benchmark/registry.py` 只保存导入字符串，因此发现过程保持懒加载；
- `rayorch/benchmark/execution.py` 包装 Executor、profile 和报告产物；
- `rayorch/benchmark/submission.py` 序列化配置，并通过 Ray Jobs 提交同一个 Benchmark；
- `rayorch/benchmarks/<name>/` 存放具体负载的 UDF、Pipeline、配置和环境声明。

因此，用户可以先写普通 Pipeline，之后再把它包装为可复现实验，而不需要改变底层执行模型。

## 所有权边界

| 组件 | 拥有什么 | 不拥有什么 |
| --- | --- | --- |
| Compiler | 静态拓扑、不变量、RuntimePlan | Actor 或单次运行状态 |
| `InputBatchEngine` | 一个 input batch 的事实、血缘和状态迁移 | Ray handle 或资源放置 |
| `DispatchState` | READY/重试队列和 Grain 阶段 | 业务负载执行 |
| `Executor` | Actor、pending RPC、活跃 input batch 和计数器 | 图语义 |
| `Worker` | 一个常驻 UDF 和批处理 ABI 校验 | 调度决策 |
| Ray | 资源、进程放置、RPC 和对象存储 | RayOrch 的基数语义 |

当前控制面位于 Driver。Ray Actor 和数据 block 是分布式的，但每个 input batch 的语义状态由 Driver 上的 `InputBatchEngine` 持有。这让所有权和恢复行为更加明确，同时也划定了当前边界：RayOrch 面向有限批处理负载，而不是无界的分布式流式控制面。

## 推荐的源码阅读顺序

如果希望从代码层面理解 RayOrch，下面的顺序与一次真实运行的生命周期一致：

1. `rayorch/api.py`：公开编排对象；
2. `rayorch/_builder.py`：符号追踪；
3. `rayorch/_program/logical.py`：用户声明的逻辑图；
4. `rayorch/_program/compiler.py` 与 `lowering.py`：生成 `RuntimePlan`；
5. `rayorch/_execution/executor.py`：Actor 池和 Driver 事件循环；
6. `rayorch/_runtime/engine.py`：事实传播与基数语义；
7. `rayorch/_runtime/dispatch.py`：Grain 队列、状态、重试与 fencing；
8. `rayorch/_execution/worker.py`：批量 UDF 边界；
9. `rayorch/_runtime/materialize.py`：生成有序公开结果；
10. `rayorch/benchmarks/mineru/`：完整的真实模型集成。

接下来可以阅读[完成驱动运行时](runtime.md)，深入了解状态与迁移；或者回到[第一个 Pipeline](../guide/first-pipeline.md)，从最小可运行示例开始。
