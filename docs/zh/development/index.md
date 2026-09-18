# 文档开发

## 仓库结构

```text
docs/
  en/                     英文页面
  zh/                     中文页面
  .vuepress/
    config.ts             站点与构建配置
    plume.config.ts       主题和语言配置
    navbars/               顶部导航
    notes/                 分区侧边栏
    public/                静态资源
```

## 本地检查

```bash
npm ci
npm run docs:build
```

提交前应确认中英文导航都能构建、示例只使用公开 RayOrch API、不虚构 Benchmark 结果或论文信息、明确区分 RayOrch 调度与 Ray 集群调度，并始终把最短可运行路径放在高级配置之前。
