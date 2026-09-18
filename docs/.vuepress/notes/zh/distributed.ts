import type { ThemeNote } from 'vuepress-theme-plume'
import { defineNoteConfig } from 'vuepress-theme-plume'

export const Distributed: ThemeNote = defineNoteConfig({
  dir: 'distributed',
  link: '/distributed/',
  sidebar: [{ text: '分布式运行', collapsed: false, items: ["index", "resources", "cross-environment", "ray-jobs"] }],
})
