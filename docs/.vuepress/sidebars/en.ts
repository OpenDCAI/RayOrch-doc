import type { ThemeSidebarMulti } from 'vuepress-theme-plume'

export const enSidebar: ThemeSidebarMulti = {
  '/api/': [
    {
      text: 'API Reference',
      icon: 'carbon:api',
      collapsed: false,
      items: ['index'],
    },
  ],
  '/benchmarks/': [
    {
      text: 'Benchmarks',
      icon: 'carbon:chart-evaluation',
      collapsed: false,
      items: [
        { text: 'Overview', link: 'benchmarks/' },
        { text: 'Run a Benchmark', link: 'benchmarks/run' },
        { text: 'Read Performance Results', link: 'benchmarks/performance' },
      ],
    },
    {
      text: 'Real-model Workloads',
      icon: 'carbon:machine-learning-model',
      collapsed: false,
      items: [
        { text: 'MinerU PDF', link: 'benchmarks/mineru' },
        { text: 'YOLO → SAM', link: 'benchmarks/yolo-sam' },
        { text: 'Dual vLLM', link: 'benchmarks/dual-vllm' },
        { text: 'SGLang → vLLM', link: 'benchmarks/sglang-vllm' },
      ],
    },
    {
      text: 'Topology References',
      icon: 'carbon:flow',
      collapsed: false,
      items: [
        { text: 'Nested Document', link: 'benchmarks/document-topology' },
        { text: 'Video Caption', link: 'benchmarks/video-caption' },
        { text: 'Video Multimodal', link: 'benchmarks/video-multimodal' },
      ],
    },
    {
      text: 'Build Your Own',
      icon: 'carbon:development',
      collapsed: false,
      items: [
        { text: 'Write a Benchmark', link: 'benchmarks/write' },
      ],
    },
  ],
  '/': [
    {
      text: 'Basic Information',
      icon: 'carbon:idea',
      collapsed: false,
      items: [
        { text: 'Introduction', link: 'guide/' },
        { text: 'Framework Design', link: 'architecture/' },
        { text: 'Paper Overview', link: 'paper/' },
      ],
    },
    {
      text: 'Get Started',
      icon: 'carbon:rocket',
      collapsed: false,
      items: [
        { text: 'Installation', link: 'guide/installation' },
        { text: 'Quickstart—Your First Pipeline', link: 'guide/first-pipeline' },
        { text: 'Quickstart—Fan-out and Reduction', link: 'guide/fan-out-and-reduce' },
        { text: 'Quickstart—Multi-node and Multi-GPU', link: 'guide/multi-node' },
        { text: 'Quickstart—Run a Benchmark', link: 'benchmarks/run' },
      ],
    },
    {
      text: 'Advanced Usage',
      icon: 'carbon:flow',
      collapsed: false,
      items: [
        { text: 'Programming Model', link: 'concepts/' },
        { text: 'Cardinality and Lineage', link: 'concepts/cardinality' },
        { text: 'Resources and Batching', link: 'distributed/resources' },
        { text: 'Distributed Execution Contract', link: 'distributed/' },
        { text: 'Cross-environment Stages', link: 'distributed/cross-environment' },
        { text: 'Ray Jobs and Submission', link: 'distributed/ray-jobs' },
        { text: 'Completion-driven Runtime', link: 'architecture/runtime' },
        { text: 'Reproduce the Experiments', link: 'paper/reproduction' },
      ],
    },
    {
      text: 'Capabilities and Boundaries',
      icon: 'carbon:rule',
      collapsed: false,
      items: [
        { text: 'What RayOrch Does—and Does Not Do', link: 'guide/boundaries' },
        { text: 'Results, Failures, and Recovery', link: 'concepts/results-failures' },
      ],
    },
  ],
}
