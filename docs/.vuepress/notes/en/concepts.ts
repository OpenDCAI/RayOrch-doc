import type { ThemeNote } from 'vuepress-theme-plume'
import { defineNoteConfig } from 'vuepress-theme-plume'

export const Concepts: ThemeNote = defineNoteConfig({
  dir: 'concepts',
  link: '/concepts/',
  sidebar: [{ text: 'Concepts', collapsed: false, items: ["index", "cardinality", "results-failures"] }],
})
