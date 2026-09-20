# Built-in Benchmarks

Built-in Benchmarks now have dedicated pages. Every page includes a workload explanation, Mermaid topology, runnable configuration, output fields, and the performance dimensions the case can expose.

## Real-model workloads

- [MinerU PDF](mineru.md): dynamic page fan-out, cross-PDF GPU batching, and ordered document reconstruction.
- [YOLO → SAM](yolo-sam.md): a multi-stage image pipeline with two persistent vision-model pools.
- [Dual vLLM](dual-vllm.md): generation and refinement through two persistent LLM engines.
- [SGLang → vLLM](sglang-vllm.md): one Pipeline whose inference backends run in separate Conda environments.

## Dependency-free topology references

- [Nested Document](document-topology.md): two levels of Document → Page → TableJob expansion and reduction.
- [Video Caption](video-caption.md): the basic Video → Frame → Video `1 → M → 1` relation.
- [Video Multimodal](video-multimodal.md): audio and vision sibling branches joined by parent Video.

See the [Benchmarks Overview](index.md) for selection guidance and [Interpret Performance Results](performance.md) for metric semantics.
