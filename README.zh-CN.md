# RayOrch 文档

这是 [RayOrch](https://github.com/OpenDCAI/RayOrch) 的中英文官方文档站，使用 VuePress 2 与 VuePress Theme Plume 构建。

## 本地开发

```bash
npm ci
npm run docs:dev
```

提交 Pull Request 前请执行：

```bash
npm run docs:build
```

英文页面位于 `docs/en/`，中文页面位于 `docs/zh/`。新增主题时应尽量保持两种语言的导航和覆盖范围一致。站点按 GitHub Pages 路径 `/RayOrch-doc/` 构建。

## 许可证

Apache-2.0，详见 `LICENSE`。
