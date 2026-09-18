import type { ThemeNote } from 'vuepress-theme-plume'
import { defineNoteConfig } from 'vuepress-theme-plume'

export const Architecture: ThemeNote = defineNoteConfig({
  dir: 'architecture',
  link: '/architecture/',
  sidebar: [{ text: 'Architecture', collapsed: false, items: ["index", "runtime"] }],
})
