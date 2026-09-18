import type { ThemeNote } from 'vuepress-theme-plume'
import { defineNoteConfig } from 'vuepress-theme-plume'

export const Benchmarks: ThemeNote = defineNoteConfig({
  dir: 'benchmarks',
  link: '/benchmarks/',
  sidebar: [{ text: 'Benchmarks', collapsed: false, items: ["index", "run", "write", "built-ins"] }],
})
