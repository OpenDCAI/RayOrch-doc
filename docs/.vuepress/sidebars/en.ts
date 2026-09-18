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
  '/': [
    {
      text: 'Why RayOrch',
      icon: 'carbon:idea',
      collapsed: false,
      items: [
        { text: 'What is RayOrch?', link: 'guide/' },
        { text: 'Architecture: Code to Cluster', link: 'architecture/' },
        { text: 'Paper Overview', link: 'paper/' },
      ],
    },
    {
      text: 'Quickstart',
      icon: 'carbon:rocket',
      collapsed: false,
      items: [
        { text: 'Installation', link: 'guide/installation' },
        { text: 'Your First Pipeline', link: 'guide/first-pipeline' },
        { text: 'Run a Benchmark', link: 'benchmarks/run' },
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
        { text: 'Distributed Execution', link: 'distributed/' },
        { text: 'Cross-environment Stages', link: 'distributed/cross-environment' },
        { text: 'Ray Jobs and Submission', link: 'distributed/ray-jobs' },
        { text: 'Benchmark Design', link: 'benchmarks/' },
        { text: 'Write a Benchmark', link: 'benchmarks/write' },
        { text: 'Built-in Workloads', link: 'benchmarks/built-ins' },
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
