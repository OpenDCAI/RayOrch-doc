import type { ThemeNote } from 'vuepress-theme-plume'
import { defineNoteConfig } from 'vuepress-theme-plume'

export const Concepts: ThemeNote = defineNoteConfig({
  dir: 'concepts',
  link: '/concepts/',
  sidebar: [{ text: '核心概念', collapsed: false, items: ["index", "cardinality", "results-failures"] }],
})
