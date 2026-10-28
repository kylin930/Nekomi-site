# v1 交付验证

## 审计来源

- Nekomi main：`fde845be32b3ad73baaa34a12e436f3c085093cd`。
- 阅读 README、完整配置参考 / Schema、功能文档、CHANGELOG、许可与核心布局 / 组件；检查真实截图。
- 源码 package.json：`1.0.0`；同步时无 Git Tag、无正式或预发布 GitHub Release；仓库 homepage 为空，没有捏造在线 Demo。
- 主题检出的 Git 工作区保持干净。官网位于独立目录，不修改主题功能。

## 已执行

| 检查 | 实际结果 |
| --- | --- |
| `npm ci --cache /workspace/.npm-cache` | 通过，411 个锁定依赖包 |
| `npm run check` | 0 错误、0 警告、0 提示 |
| `npm test` | 3 项通过；配置校验、来源链接转换、全部文档渲染 / 截图校验 |
| 默认根路径静态构建 | 成功，23 个 HTML 页面（包括 404），另有 JSON / XML / robots 端点 |
| `/Nekomi-website/` 子路径静态构建 | 成功，所有资源与站内链接使用正确前缀 |
| 静态链接 / 锚点 / ID / h1 检查 | 根路径和子路径分别验证 23 页、1,178 处引用，0 错误 |
| GitHub 文档与源码目标 | 50 个固定提交的源码 / 示例路径均在上游实际存在 |
| 发布元数据 | 22 页 Canonical 与 OG URL 和 22 条 Sitemap 正确；robots 引用正确子路径 Sitemap |
| 上游同步 | 默认远端克隆与干净本地 checkout 两种模式均已实际执行成功 |
| 许可生成 | 17 个 MDUI 浏览器依赖包的许可保留于静态产物 |
| Chromium 浏览器 | 根路径及子路径各 211 项断言通过；详细结果在 test-results JSON |
| axe-core 4.14.0 | 8 个代表页面 × 浅深模式 × 1440 / 390px，共 32 次 WCAG 2 A/AA、2.1 AA 自动扫描，无违规 |

浏览器断言使用真实 Chromium（系统安装）与 Python Playwright，覆盖 320×700、390×844、768×1024、1440×1000。检查页面 HTTP 状态、可见图片、无横向溢出、单一 h1、12 种截图组合、明暗 / 系统与持久化、中文搜索 / 无结果 / 键盘 / 网络失败重试、标题片段跳转、代码复制原文、上下篇、浏览器后退、移动导航、FAQ、减少动态的返回顶部，以及禁用 JS 的配置表 / FAQ。

视觉检查打开并查看了首页桌面 / 手机 / 深色截图及三栏 / 手机文档页面。已修复初次扫描中的截图说明和 YAML 高亮对比度；改用构建期可横向滚动表格，避免关闭 JS 后手机表格撑开页面；Esc 显式关闭搜索，避免原生 search 输入先消费按键。

一次将构建输出放到 /tmp 的实验因 Astro 跨文件系统 rename 返回 EXDEV；改在同一工作盘输出后子路径构建通过。未改动 Astro / node_modules 源码，也未关闭校验。

## 复测

README 包含完整命令。浏览器测试需要先为静态产物运行 HTTP 服务。子路径测试时应将产物挂载到对应路径；不使用 SPA fallback。无障碍脚本通过 `AXE_PATH` 指向独立安装的 axe.min.js，不给官网增加生产依赖。

`test-results/` 保存本次真实截图、browser-results.json、browser-subpath-results.json、accessibility.json，目录被 Git 忽略。无障碍自动扫描不等于全部人工无障碍验收。

## 发布边界

官网源码仓库为 `kylin930/Nekomi-site`，使用 `main` 分支。尚未绑定真实官网域名或执行线上部署。默认构建无生产 Canonical、输出 noindex 与空 Sitemap；维护者填写真实域名并重建后才启用相应元数据。在线 Demo 为可选空配置。GitHub Pages 工作流和 Cloudflare Pages 操作已提供，未声称实际托管 / DNS / HTTPS 验收完成。Safari、Firefox 和屏幕阅读器未执行专项测试；生产运行没有统计、第三方字体或外部评论 SDK。

## 品牌图标更新验收

维护者提供的 `nekomi-icon.svg` 原样保存于 public/，SHA-256 为 `ff1f48cd17f0812baa7ae3651ab25b05e0c4ededd966c9625442ab5c99a87ef3`，与上传文件一致。替换页头、页脚、首页标题旁标识及 favicon；删除临时 N 字标识、旧 favicon 和未使用的花朵图形，更新来源说明。真实主题截图保留原图。

本次实际检查：

- Astro Check：0 错误、0 警告、0 提示；静态构建成功。
- 根路径和 `/Nekomi-site/` 子路径各检查 23 个页面、1,225 处链接 / 资源引用，无错误。
- 现有 Chromium 功能回归 211 项通过，无页面脚本异常。
- 新图标在根路径 / 子路径的桌面浅深、390px 手机浅深及 320px 窄屏共 10 组浏览器检查通过：三个品牌图片加载正常、无横向溢出、favicon 返回原始 SVG、没有额外底框或变色。
- 实际查看了桌面浅色与手机深色截图，图标比例和留白正常。

图标截图与检查记录保存在忽略的 `test-results/brand/`，不将本地生成的截图、依赖或构建目录提交进源码仓库。
