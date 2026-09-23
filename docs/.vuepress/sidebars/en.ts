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
        { text: 'Overview', link: 'index' },
        { text: 'Run a Benchmark', link: 'run' },
        { text: 'Read Performance Results', link: 'performance' },
      ],
    },
    {
      text: 'Real-model Workloads',
      icon: 'carbon:machine-learning-model',
      collapsed: false,
      items: [
        { text: 'MinerU Scale — Real workload', link: 'mineru-scale' },
        { text: 'MinerU PDF', link: 'mineru' },
        { text: 'YOLO → SAM', link: 'yolo-sam' },
        { text: 'Dual vLLM', link: 'dual-vllm' },
        { text: 'SGLang → vLLM', link: 'sglang-vllm' },
      ],
    },
    {
      text: 'Topology References',
      icon: 'carbon:flow',
      collapsed: false,
      items: [
        { text: 'Nested Document', link: 'document-topology' },
        { text: 'Video Caption', link: 'video-caption' },
        { text: 'Video Multimodal', link: 'video-multimodal' },
      ],
    },
    {
      text: 'Build Your Own',
      icon: 'carbon:development',
      collapsed: false,
      items: [
        { text: 'Write a Benchmark', link: 'write' },
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
