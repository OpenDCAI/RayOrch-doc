import type { ThemeNote } from 'vuepress-theme-plume'
import { defineNoteConfig } from 'vuepress-theme-plume'

export const Guide: ThemeNote = defineNoteConfig({
  dir: 'guide',
  link: '/guide/',
  sidebar: [{ text: 'Guide', collapsed: false, items: ["index", "installation", "first-pipeline"] }],
})
