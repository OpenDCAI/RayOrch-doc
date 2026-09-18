import { defineThemeConfig } from 'vuepress-theme-plume'
import { enNavbar, zhNavbar } from './navbars/index.js'
import { enNotes, zhNotes } from './notes/index.js'

export default defineThemeConfig({
  logo: '/rayorch-mark.svg',
  logoDark: '/rayorch-mark.svg',
  appearance: true,
  social: [{ icon: 'github', link: 'https://github.com/OpenDCAI/RayOrch' }],
  footer: { message: 'Built for multi-stage AI workloads on Ray.', copyright: 'Apache-2.0 licensed.' },
  locales: {
    '/en/': {
      profile: { avatar: '/rayorch-mark.svg', name: 'RayOrch Documentation', description: 'Run every stage as soon as its data is ready.' },
      navbar: enNavbar,
      notes: enNotes,
    },
    '/zh/': {
      profile: { avatar: '/rayorch-mark.svg', name: 'RayOrch 文档', description: '数据一旦就绪，立即运行下一阶段。' },
      navbar: zhNavbar,
      notes: zhNotes,
    },
  },
})
