import type { ThemeNote } from 'vuepress-theme-plume'
import { defineNoteConfig } from 'vuepress-theme-plume'

export const Development: ThemeNote = defineNoteConfig({
  dir: 'development',
  link: '/development/',
  sidebar: [{ text: '参与开发', collapsed: false, items: ["index"] }],
})
