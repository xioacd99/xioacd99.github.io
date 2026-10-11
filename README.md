# Raymond's Field Notes

一个可以直接运行的个人技术博客。Astro + TypeScript + Markdown，静态优先。源码仓库和网站均公开；用户站点仓库为 `xioacd99/xioacd99.github.io`，GitHub Pages 目标网址是 `https://xioacd99.github.io/`。现有 Sites 地址保留独立部署，两种构建配置可以并存。

## 已实现

- 默认英文，中文路径 `/zh/`；语言按钮切换到对应页面/同一篇文章，并保存选择。下一次访问首页会恢复已选择的中文；没有保存偏好时使用英文
- 导航、页面文案、文章内容管线、搜索提示、元数据和 RSS 均区分中英文

- 响应式首页、文章列表/详情、主题目录与分类页
- 本地全文搜索：标题、摘要、标签和 Markdown 正文；不调用外部搜索服务
- 浅色/深色主题，系统偏好与本地记忆
- Markdown 内容集合、类型校验、草稿与未来日期过滤、代码高亮、文章目录
- RSS、sitemap、robots.txt、canonical、Open Graph、X 大图卡片元数据
- 每篇文章对应的本地 1200 × 630 PNG 图片，X 分享入口、复制文章链接
- GitHub 仓库入口与 Star 入口（不伪造 Star 数量）
- GitHub Actions 安全构建检查；Pages 使用手动触发及显式仓库开关

演示文章及其专用封面已移除，当前没有已发布文章。首页、文章列表、主题页和搜索均提供中英文空态，RSS 保持有效空订阅源。添加首篇双语文章后，内容索引与页面会自动生成。

## 快速开始

需要 Node.js 22.12+，推荐 Node.js 24。

```sh
npm ci --ignore-scripts
npm run dev
# 默认 http://127.0.0.1:4321
```

验证生产构建：

```sh
npm run verify
npm run preview
```

`verify` 依次执行 Astro/TypeScript 检查、构建和 Node 内置测试。测试覆盖页面、站内链接、RSS/sitemap、canonical/分享元数据、PNG 尺寸、搜索条目及公开发布开关。Astro CLI 通过一个轻量包装脚本启动，默认关闭 Astro 构建工具遥测。浏览器不加载第三方字体、统计脚本或远程素材。

## 为什么没有常驻后端？

本站的“后台”是可追踪的内容与构建流程：

```text
Markdown + frontmatter
         ↓ 校验、过滤草稿/未来日期
Astro 内容集合 + TypeScript 模板
         ↓ 构建时生成
HTML / CSS / 少量浏览器 JS / RSS / sitemap / PNG 卡片
         ↓ 部署静态目录 dist/
GitHub Pages 用户站点 / 独立 Sites 部署
```

阅读、搜索、分类、RSS 和分享不需要账号、数据库或服务端 API。没有虚假的管理后台或不能用的发布按钮。写作直接在仓库中进行；若将来确实需要评论、在线 CMS 或订阅邮件，再单独选择服务。

## 写一篇文章

在 `src/content/blog/en/` 与 `src/content/blog/zh/` 分别创建同名的 Markdown 文件，例如 `my-first-post.md`，保存英文与中文版本。英文 URL 是 `/articles/my-first-post/`，中文 URL 是 `/zh/articles/my-first-post/`。文件名是两种语言的配对键，正式发布后尽量不要改名。构建测试会检查已发布文章的语言配对。

```markdown
---
lang: zh
title: "我的第一篇技术笔记"
description: "一两句话说明这篇文章解决什么问题。"
date: "2026-10-10"
tags: ["AI Engineering", "System Design"]
category: "AI Engineering"
readingTime: "5 min"
featured: false
demo: false
draft: false
coverTitle: "A useful first step"
---

## 问题是什么

在这里写正文。
```

- 中文文件设置 `lang: zh`，英文对应文件设置 `lang: en`，并翻译标题、摘要和正文。日期与标签应保持一致
- `lang`、`title`、`description`、`date`、`tags`、`category`、`readingTime` 必填
- `featured` 控制首页主推文章；没有主推时使用最新文章
- `draft: true` 或日期晚于构建时间的文章不会进入站点、RSS、搜索或 sitemap
- `coverTitle` 可选，用简短英文作为自动生成卡片上的排版标题；未填时用博客品牌。这样无需依赖 CI 机器的中文字体。页面与社交元数据仍使用完整中文文章标题
- 二级标题自动进入文章目录；代码块自动高亮
- 两种语言一起修改后运行 `npm run verify`。已有公开环境不会自动接收内容，除非你明确启用对应部署流程
- 未来日期文章需要在日期到达后重新构建才会出现，本站不会后台定时发布

主题页面自动生成。建议保持标签拼写一致，避免 `AI Engineering` 与 `AI engineering` 成为不同主题。

## 配置网址与仓库

参见 `.env.example`。构建变量：

| 变量 | 用途 | 默认值 |
| --- | --- | --- |
| `PUBLIC_SITE_URL` | 最终网址的 origin，不含子路径 | `https://example.com` |
| `PUBLIC_BASE_PATH` | 用户站点与 Sites 使用 `/`；其他项目仓库使用 `/<repository-name>` | `/` |
| `PUBLIC_REPOSITORY_URL` | GitHub/Star 链接目标 | `https://github.com/xioacd99/xioacd99.github.io` |

不要将 `example.com` 作为正式部署配置。当前公开 Sites 站点的构建示例：

```sh
PUBLIC_SITE_URL=https://raymond-field-notes.feyslug64.chatgpt.site PUBLIC_BASE_PATH=/ npm run verify
```

GitHub Pages 用户站点构建示例（只构建，不上传）：

```sh
PUBLIC_SITE_URL=https://xioacd99.github.io PUBLIC_BASE_PATH=/ npm run verify
```

如使用自定义域名，将 origin 改成该域名，`PUBLIC_BASE_PATH=/`。在 Windows PowerShell 中先用 `$env:PUBLIC_SITE_URL="…"` 设置变量，再运行构建命令。

Astro 配置通过 `process.env` 读取这两个构建变量。`.env.example` 是配置说明，不会自动覆盖构建命令。不要把凭证放在 `PUBLIC_` 变量里。

## GitHub Pages 与 Sites 独立部署

公开 Sites 站点的项目配置独立保管，不随 GitHub 源码提交。部署目录是 `dist/`。更改源码后使用 Sites 的官方工作流构建、保存版本、部署，并保持已批准的公开访问范围。

GitHub 仓库的 `ci.yml` 只安装、审计、检查、构建并保存产物，推送到 `main` 不会自动部署网站。GitHub Pages 使用单独的手动工作流；Sites 仍通过自己的部署流程更新。

`pages.yml` 有两道限制：

1. 仅允许手动 `workflow_dispatch`，不监听 push
2. 只有仓库变量 `ENABLE_PUBLIC_PAGES=true` 时运行

将仓库 Pages 的发布来源设为 GitHub Actions，并在确认发布后设置 `ENABLE_PUBLIC_PAGES=true`，然后手动运行 Pages 工作流。代码中的开关检查与手动触发要求始终保留，不因仓库改名而扩大权限。

`scripts/github-pages-config.mjs` 只在 Pages 工作流中运行：当仓库名是 `<owner>.github.io` 时使用根路径 `/`，其他项目仓库使用 `/<repository-name>`。它同时设置对应的站点 origin 与仓库链接。该脚本不会写入 Astro 的全局默认值；构建 Sites 时仍显式使用原 Sites origin 和 `/`。

用户站点不能使用 `/xioacd99.github.io` 或旧的 `/tech-blogs` 作为 base。两种部署应分别生成 canonical、RSS、sitemap 和分享图片 URL，不要将其中一份 `dist/` 直接当作另一站点的构建产物。自定义域名需要另外确认并调整 Pages 配置脚本的 origin/base。规则参考 [GitHub Pages 站点类型](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)。

## X 分享卡片与 GitHub Stars

每篇文章输出 `summary_large_image`、绝对文章 URL 和绝对 PNG 图片 URL。X 是否显示卡片还取决于其抓取、缓存和平台策略，不能保证每次即时呈现。当前文章与图片已公开可访问，但尚不保证 X 已成功抓取或展示卡片。

“Star on GitHub”打开对应仓库，不会替读者自动点 Star。源码仓库已公开，读者可以查看源码并自行选择是否 Star。

## 目录

```text
src/content/blog/en/   英文 Markdown 文章（默认）
src/content/blog/zh/   同名中文译文
src/views/             共享双语页面组件
src/content.config.ts  内容元数据校验
src/components/        导航、卡片、图形、页脚
src/layouts/           HTML 外壳、SEO 和分享元数据
src/pages/             静态路由、RSS、robots
src/lib/               路径、日期、文章筛选、语言文案
src/styles/            响应式样式与主题
scripts/               构建包装、卡片生成
tests/                 产物和部署安全检查
public/                图标、卡片图片、.nojekyll
.github/workflows/     安全 CI 与显式开关控制的手动 Pages 部署
```

## 维护与扩展

依赖版本由 `package-lock.json` 和 npm 完整性校验固定，CI 使用 `npm ci --ignore-scripts`，避免依赖安装时执行生命周期脚本。当前依赖的预编译组件已通过这种安装方式验证；新增依赖时应重新验证，不要直接移除该限制。升级后运行 `npm run verify`，并检查手机/桌面排版、搜索空状态、主题切换、文章目录与链接。内容由仓库维护者控制；不要直接渲染未经审查的外部 Markdown/HTML。

### 构建安全

- CI 与手动 Pages 构建都会执行 `npm audit --audit-level=moderate`，已知中危及以上依赖告警会阻止后续构建/发布。审计依赖 npm 官方服务，服务不可用时也会失败；应查明原因后重跑，不要直接忽略告警
- 官方 GitHub Actions 均固定到完整 commit SHA；升级时核验官方 release 对应的 commit，同时检查 composite action 内部引用。Pages artifact 使用 v4，内部 upload action 同样固定 SHA，且不会打包隐藏文件
- 构建只授予 `contents: read`，checkout 不保留 Git 凭据；仅已存在、手动且开关控制的 Pages deploy job 保留必需的 `pages: write` 和 `id-token: write`
- 构建任务 15 分钟超时，Pages 发布 10 分钟超时；普通 CI 产物保存 7 天，缺失产物立即报错
- 封面工具只解析 YAML 数据，拒绝可执行 frontmatter、重复键与过度 alias 展开。旧 `gray-matter` 依赖链已移除；图片工具使用已修复版本 `sharp@0.35.5`
- 安全回归测试检查 workflow 权限、Action SHA、包来源及 YAML 输入。可手动运行 `npm audit` 查看全部审计结果；零告警不代表没有未知漏洞

这些源码和构建检查不负责更改账号安全设置、分支保护、令牌权限、Pages 开关或域名；相关设置需在 GitHub 中单独管理。网站没有用户上传、评论、登录或常驻 API；后续加入这些功能前需要重新评估威胁和输入处理。

本项目尚未选择开源许可证；公开可见不等于授予开源使用许可。正式复用或转载前请联系作者，后续可单独选择许可证和内容版权声明。
