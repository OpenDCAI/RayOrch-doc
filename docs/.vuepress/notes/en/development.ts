import type { ThemeNote } from 'vuepress-theme-plume'
import { defineNoteConfig } from 'vuepress-theme-plume'

export const Development: ThemeNote = defineNoteConfig({
  dir: 'development',
  link: '/development/',
  sidebar: [{ text: 'Development', collapsed: false, items: ["index"] }],
})
