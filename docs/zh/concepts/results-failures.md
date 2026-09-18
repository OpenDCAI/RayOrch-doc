# 结果与失败

## 成功结果

`RunResult.outputs` 保持 Pipeline 声明的输出结构。成功业务值原样返回，包括 `None` 和空列表。

```python
result = ro.run(MyPipeline(), inputs)
print(result.outputs)
print(result.elapsed_s)
print(result.rpc_count)
```

每个 Call 的指标包含 Actor 数、RPC 数、Grain 调度数、重排队次数和实际 RPC batch size；input batch 指标包含逻辑 Entity、Item、Expansion、Grain 数量和释放值数量。

## UDF 显式返回业务失败

```python
from rayorch import RecordFailure

class Parse:
    def run(self, rows):
        return [RecordFailure("invalid input") if bad(row) else parse(row) for row in rows]
```

- `RecordFailure(cause)`：只标记一个逻辑记录失败；
- `GroupFailure(cause)`：同时抑制同一个直接父项下的兄弟记录。

最终的非成功结果使用 `OutputIssue` 表达。判断时读取公开的 `ItemOutcome`，不要解析诊断字符串。

## UDF 异常与恢复

```python
from rayorch import RecoveryPolicy

self.stage = ro.RayModule(Stage).ray_options(
    replicas=2,
    batch_size=16,
    recovery=RecoveryPolicy.retry_batch(max_retries=2),
)
```

恢复策略包括直接中止、立即重试整批、延后重试，以及延后重试后拆分到单条隔离；基础设施重试也有独立上限。

RayOrch 不会强行给任意用户代码增加墙钟超时。如果外部服务或模型调用可能卡住，请在 UDF 所使用的客户端内设置超时；Driver 等待远程任务可使用 Ray Job 的等待超时。
