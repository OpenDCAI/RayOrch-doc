import type { ThemeNoteListOptions } from 'vuepress-theme-plume'
import { defineNotesConfig } from 'vuepress-theme-plume'
import { Guide } from './guide.js'
import { Concepts } from './concepts.js'
import { Distributed } from './distributed.js'
import { Benchmarks } from './benchmarks.js'
import { Architecture } from './architecture.js'
import { Api } from './api.js'
import { Paper } from './paper.js'
import { Development } from './development.js'

export const zhNotes: ThemeNoteListOptions = defineNotesConfig({ dir: 'zh', link: '/zh/', notes: [Guide, Concepts, Distributed, Benchmarks, Architecture, Api, Paper, Development] })
