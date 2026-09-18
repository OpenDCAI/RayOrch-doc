import { defineNavbarConfig } from 'vuepress-theme-plume'
export const zhNavbar = defineNavbarConfig([
  { text: '上手指南', link: '/zh/guide/', icon: 'icon-park-outline:guide-board' },
  { text: '核心概念', link: '/zh/concepts/', icon: 'carbon:flow' },
  { text: '分布式运行', link: '/zh/distributed/', icon: 'carbon:network-4' },
  { text: '基准与实验', link: '/zh/benchmarks/', icon: 'carbon:meter' },
  { text: '系统架构', link: '/zh/architecture/', icon: 'carbon:diagram' },
  { text: 'API', link: '/zh/api/', icon: 'carbon:api' },
  { text: '论文', link: '/zh/paper/', icon: 'carbon:document' },
])
