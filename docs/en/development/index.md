# Documentation Development

## Repository layout

```text
docs/
  en/                     English pages
  zh/                     Chinese pages
  .vuepress/
    config.ts             site and build configuration
    plume.config.ts       theme and locale configuration
    navbars/               top navigation
    notes/                 section sidebars
    public/                static assets
```

## Local checks

```bash
npm ci
npm run docs:build
```

Before submitting changes, verify both language navigation trees, use public RayOrch APIs in examples, do not invent Benchmark results or paper metadata, distinguish RayOrch scheduling from Ray cluster scheduling, and keep the shortest successful path visible before advanced options.
