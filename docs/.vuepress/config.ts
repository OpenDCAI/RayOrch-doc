import { viteBundler } from '@vuepress/bundler-vite'
import { redirectPlugin } from '@vuepress/plugin-redirect'
import { defineUserConfig } from 'vuepress'
import { plumeTheme } from 'vuepress-theme-plume'

export default defineUserConfig({
  base: '/RayOrch-doc/',
  lang: 'en-US',
  locales: {
    '/en/': { title: 'RayOrch', lang: 'en-US', description: 'Completion-driven dataflow orchestration for multi-stage AI workloads on Ray.' },
    '/zh/': { title: 'RayOrch', lang: 'zh-CN', description: '面向 Ray 多阶段 AI 工作负载的完成驱动数据流编排。' },
  },
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/RayOrch-doc/rayorch-mark.svg' }]],
  bundler: viteBundler(),
  shouldPrefetch: false,
  theme: plumeTheme({
    cache: 'filesystem',
    autoFrontmatter: false,
    search: { provider: 'local' },
    markdown: { mermaid: true },
    codeHighlighter: { lineNumbers: true },
  }),
  plugins: [redirectPlugin({ autoLocale: true })],
})
