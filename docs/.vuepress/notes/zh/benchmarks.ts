import type { ThemeNote } from 'vuepress-theme-plume'
import { defineNoteConfig } from 'vuepress-theme-plume'

export const Benchmarks: ThemeNote = defineNoteConfig({
  dir: 'benchmarks',
  link: '/benchmarks/',
  sidebar: [{ text: '基准与实验', collapsed: false, items: ["index", "run", "write", "built-ins"] }],
})
