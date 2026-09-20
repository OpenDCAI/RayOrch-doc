import { defineNavbarConfig } from 'vuepress-theme-plume'

export const enNavbar = defineNavbarConfig([
  { text: 'Guide', link: '/en/guide/', icon: 'icon-park-outline:guide-board' },
  { text: 'Benchmarks', link: '/en/benchmarks/', icon: 'carbon:chart-evaluation' },
  { text: 'API Reference', link: '/en/api/', icon: 'carbon:api' },
])
