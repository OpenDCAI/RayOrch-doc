import type { ThemeSidebarMulti } from 'vuepress-theme-plume'

export const zhSidebar: ThemeSidebarMulti = {
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
      text: '基本信息',
      icon: 'carbon:idea',
      collapsed: false,
      items: [
        { text: '简介', link: 'guide/' },
        { text: '框架设计', link: 'architecture/' },
        { text: '论文导读', link: 'paper/' },
      ],
    },
    {
      text: '从这里开始',
      icon: 'carbon:rocket',
      collapsed: false,
      items: [
        { text: '安装', link: 'guide/installation' },
        { text: '快速上手—第一个 Pipeline', link: 'guide/first-pipeline' },
        { text: '快速上手—一对多与有序聚合', link: 'guide/fan-out-and-reduce' },
        { text: '快速上手—多机多卡', link: 'guide/multi-node' },
        { text: '快速上手—运行 Benchmark', link: 'benchmarks/run' },
      ],
    },
    {
      text: '进阶玩法',
      icon: 'carbon:flow',
      collapsed: false,
      items: [
        { text: '编程模型', link: 'concepts/' },
        { text: '基数与血缘', link: 'concepts/cardinality' },
        { text: '资源、副本与批处理', link: 'distributed/resources' },
        { text: '分布式运行契约', link: 'distributed/' },
        { text: '跨环境阶段', link: 'distributed/cross-environment' },
        { text: 'Ray Job 与源码提交', link: 'distributed/ray-jobs' },
        { text: 'Benchmark 设计', link: 'benchmarks/' },
        { text: '编写 Benchmark', link: 'benchmarks/write' },
        { text: '内置负载', link: 'benchmarks/built-ins' },
        { text: '完成驱动运行时', link: 'architecture/runtime' },
        { text: '复现实验', link: 'paper/reproduction' },
      ],
    },
    {
      text: '能力边界',
      icon: 'carbon:rule',
      collapsed: false,
      items: [
        { text: 'RayOrch 做什么、不做什么', link: 'guide/boundaries' },
        { text: '结果、失败与恢复', link: 'concepts/results-failures' },
      ],
    },
  ],
}
