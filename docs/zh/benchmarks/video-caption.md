# 视频描述拓扑 Benchmark

`VideoCaptionTopologyBench` 是最小的 `Video → Frame → Video` 参考案例。每个视频展开为有序帧，来自不同视频的 READY 帧可以一起进入 Caption Actor 批次，完成后再按原视频和帧序归并为一个摘要记录。

## 拓扑

```mermaid
flowchart LR
    Video["Video"] --> Decode["DecodeFrames"]
    Decode --> Expand["F.expand"]
    Expand --> Frames["Frame Domain<br/>跨视频独立调度"]
    Frames --> Caption["CaptionFrames<br/>Actor 池组批"]
    Caption --> Reduce["F.reduce<br/>恢复帧顺序"]
    Reduce --> Summary["SummarizeCaptions"]
    Summary --> Output["一个结果 / Video"]
```

## 运行

```python
from rayorch.benchmark import VideoCaptionTopologyBench

report = VideoCaptionTopologyBench(
    output_dir="./results",
    video_count=8,
    frames_per_video=16,
    workers=4,
    batch_size=8,
    input_batch_size=1,
    max_active_input_batches=4,
).run(profile=False)
```

该案例生成逻辑视频和帧，不读取真实媒体，也不加载 VLM。

## 输出与指标

每个输出包含视频名、有序帧 ID 和确定性的 caption 字符串；报告增加总 `frames`。

## 体现什么性能

| 观察项 | 实验方式 | 能回答的问题 |
| --- | --- | --- |
| 帧级调度吞吐 | `frames / measured_wall_s` | `1 → M → 1` 控制面的帧处理速率 |
| 跨视频组批 | 增大 `video_count` 与 active input batches | 多个输入是否让 Caption Call 更容易填满 batch |
| 保序成本 | 增大 `frames_per_video` | 大子项组归并回父项的成本如何变化 |
| Worker/RPC 权衡 | 扫描 `workers` 和 `batch_size` | 轻量 UDF 下增加 Actor 是否值得 |

它适合验证真实视频模型接入前的数据形态和调度参数，但其数字不代表解码或 VLM 推理性能。
