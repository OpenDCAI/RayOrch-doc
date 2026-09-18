import type { ThemeNote } from 'vuepress-theme-plume'
import { defineNoteConfig } from 'vuepress-theme-plume'

export const Paper: ThemeNote = defineNoteConfig({
  dir: 'paper',
  link: '/paper/',
  sidebar: [{ text: '论文', collapsed: false, items: ["index", "reproduction"] }],
})
