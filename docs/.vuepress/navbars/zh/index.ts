import { defineNavbarConfig } from 'vuepress-theme-plume'

export const zhNavbar = defineNavbarConfig([
  { text: '指南', link: '/zh/guide/', icon: 'icon-park-outline:guide-board' },
  { text: 'Benchmarks', link: '/zh/benchmarks/', icon: 'carbon:chart-evaluation' },
  { text: 'API Reference', link: '/zh/api/', icon: 'carbon:api' },
])
