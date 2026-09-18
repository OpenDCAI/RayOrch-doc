import type { ThemeNote } from 'vuepress-theme-plume'
import { defineNoteConfig } from 'vuepress-theme-plume'

export const Paper: ThemeNote = defineNoteConfig({
  dir: 'paper',
  link: '/paper/',
  sidebar: [{ text: 'Paper', collapsed: false, items: ["index", "reproduction"] }],
})
