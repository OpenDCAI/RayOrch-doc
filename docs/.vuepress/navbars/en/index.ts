import { defineNavbarConfig } from 'vuepress-theme-plume'
export const enNavbar = defineNavbarConfig([
  { text: 'Guide', link: '/en/guide/', icon: 'icon-park-outline:guide-board' },
  { text: 'Concepts', link: '/en/concepts/', icon: 'carbon:flow' },
  { text: 'Distributed', link: '/en/distributed/', icon: 'carbon:network-4' },
  { text: 'Benchmarks', link: '/en/benchmarks/', icon: 'carbon:meter' },
  { text: 'Architecture', link: '/en/architecture/', icon: 'carbon:diagram' },
  { text: 'API', link: '/en/api/', icon: 'carbon:api' },
  { text: 'Paper', link: '/en/paper/', icon: 'carbon:document' },
])
