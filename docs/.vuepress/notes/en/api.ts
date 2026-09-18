import type { ThemeNote } from 'vuepress-theme-plume'
import { defineNoteConfig } from 'vuepress-theme-plume'

export const Api: ThemeNote = defineNoteConfig({
  dir: 'api',
  link: '/api/',
  sidebar: [{ text: 'API', collapsed: false, items: ["index"] }],
})
