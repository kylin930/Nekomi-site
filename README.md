# Nekomi-website

Nekomi 静态博客主题的独立官网 v1。Astro 7 + MDUI 2.1.5 + 原生 CSS / TypeScript，构建为纯静态 HTML，不依赖 React、Vue、数据库或常驻后端。主题源码仅作为只读审计来源，未修改其业务逻辑。

官网源码仓库：[kylin930/Nekomi-site](https://github.com/kylin930/Nekomi-site)。主题仓库仍为 [kylin930/Nekomi](https://github.com/kylin930/Nekomi)。

## 本地开发

推荐 Node.js 24 LTS（最低 22.23.4），使用仓库锁文件：

```sh
git clone https://github.com/kylin930/Nekomi-site.git
cd Nekomi-site
npm ci
npm run dev
npm run check
npm test
npm run build
npm run preview
```

开发默认端口 4321。仅开发 / 构建需要 Node；部署 `dist/`。网络受限的云机器可使用 `npm ci --cache /workspace/.npm-cache`，设置 `ASTRO_TELEMETRY_DISABLED=1` 避免写入不可写的用户配置目录。

## 配置与正式发布

唯一配置入口是 `website.config.mjs`：

- `url`：真实 HTTP(S) 源站域名，不带子路径。也可用构建环境变量 `SITE_URL` 覆盖。
- `base`：部署路径，以 / 开始和结束。也可用 `SITE_BASE` 覆盖。
- `demoUrl`：已部署的真实主题演示，或 `DEMO_URL`。留空时仅展示截图并明确说明尚未配置。
- `github`：主题 GitHub 仓库链接。
- `docs.repository` / `docs.ref`：同步源和分支；当前为官方主题的 main。
- `description`、`name`、`indexing`：公开元数据与收录设置。

没有域名时输出 noindex、不捏造 Canonical / og:url，Sitemap 为空。配置真实域名并重建后自动生成每页 Canonical、OG、Twitter 元数据、WebSite JSON-LD、Sitemap 和 robots。

配置只使用公开值，不填写任何私钥。环境变量在 shell / 托管平台中设置；根 `.env` 不会自动加载到配置模块。

### GitHub Pages

1. 使用本官网仓库或 Fork，不需要将主题源码放入官网项目。
2. Settings → Pages → Source 选择 GitHub Actions。
3. Actions Variables 设置 `SITE_URL=https://你的用户名.github.io`、`SITE_BASE=/Nekomi-site/`；用户名主页仓库或自定义域名的根路径使用 `/`。可选 `DEMO_URL`。
4. 手动运行 Deploy website 工作流。工作流检查、测试、构建并上传静态产物，默认不会随推送自动发布。
5. 自定义域名在平台配置 DNS / HTTPS，并按需要创建 public/CNAME，再设置对应 SITE_URL / SITE_BASE。

### Cloudflare Pages

连接本官网仓库，Node 24，构建命令 `npm run build`，输出目录 `dist`；设置 `SITE_URL` 为真实部署源站，`SITE_BASE=/`，Demo 可选。不要添加把所有 URL 重写到首页的 SPA fallback。

### 根域与子路径验证

```sh
SITE_URL=https://example.org SITE_BASE=/ npm run build
python3 tests/check-links.py dist /
SITE_URL=https://your-name.github.io SITE_BASE=/Nekomi-site/ npm run build
python3 tests/check-links.py dist /Nekomi-site/
```

`example.org` 仅为配置示例，不代表已上线域名。子路径下生成的 robots.txt 不能替代域名根目录的 robots；有根站管理权限时合并 Sitemap 声明。404.html 已生成；需托管服务保留真实 404 状态，目录 URL 解析到 index.html。

## 文档同步：只有一个内容维护来源

主题仓库是完整配置与功能文档的唯一维护来源。官网不手抄配置字段表，也不会在每次构建时追踪可变 main：

```sh
npm run sync:docs
# 或审计时使用干净的本地上游 checkout
NEKOMI_SOURCE=/path/to/Nekomi npm run sync:docs
```

同步需要 Git、curl 与联网：获取指定分支，检查干净工作区和来源，记录完整提交 SHA、package.json 版本、真实 tags 和 GitHub releases；API 错误会中止，不会当作“没有 Release”。同步注册的 17 篇阅读条目（包括 README 选章的原始来源）、CHANGELOG、许可原文和 32 张已审核真实截图。所有内容放入 `vendor/nekomi/snapshot.json` 与 `public/screenshots/`，作为可审查、可提交的快照。**日常构建直接使用快照，无需 GitHub 联网。** 同步后检查 diff、重新运行 check / test / build 与浏览器检查，再提交快照和素材。不要手改快照以修复主题文档，请改上游后同步。

官网渲染时将相对文档链接映射为站内页面，其他源码 / 示例链接固定到同步提交；图片映射为本地已审核截图或固定来源。Markdown 的代码围栏、表格、嵌套示例保留；文档中的 directive / Mermaid / KaTeX 都是代码示例，原样展示，不执行示例脚本。使用 Markdown AST 移除重复标题和上游“目录”段；快速开始只选取 README 的安装、基础配置、首篇文章和发布章节，并按上手顺序排列。提取不依赖字符位置，也不会把代码围栏里的标题当作章节。找不到安装章节时，同步和构建会明确报错，不会退回整份 README；升级 / 历史章节的链接仍指向固定提交的上游原文。快照始终保存完整原文。

新增或改变文档路径时更新 `src/data/docs.mjs`；有新的截图时先核实来源与许可，再修改同步脚本的明确选择规则。不会默默同步上游的个人背景或角色素材。当前没有将 Release 说明草稿当成已经发布的 Release。

## 页面与组件

| 路径                          | 内容                                                                                |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| `/`                           | 项目介绍、真实截图切换、阅读、配置、开始使用                                        |
| `/features/`                  | 外观 / 阅读 / 内容 / 交互 / 部署的已实现能力                                        |
| `/demo/`                      | 三种预设 × 明暗 × 桌面 / 手机，共 12 个真实截图状态；自定义配色实验室；阅读截图画廊 |
| `/preview/colors/`            | 同源独立配色示意，noindex、不进入 Sitemap                                           |
| `/docs/`                      | 文档入口、分组及主题色快捷说明                                                      |
| `/docs/[slug]/`               | 17 篇上游文档，三栏布局 / 移动折叠、目录、代码复制、上下篇                          |
| `/changelog/`                 | 上游完整日志与版本 / Tag / Release 分离显示                                         |
| `/faq/`                       | 原生可折叠问答与文档链接                                                            |
| `/404.html`                   | 静态错误页                                                                          |
| `/search-index.json`          | 按章节的静态客户端搜索索引                                                          |
| `/sitemap.xml`、`/robots.txt` | 按域名和 base 生成                                                                  |

- `Base.astro`：导航、主题、搜索对话框、SEO、页脚、返回顶部。
- `Showcase.astro`：原图展示框与截图切换；手机首访默认手机图，之后可自由切换。
- `Logo.astro`：页头与页脚品牌入口，和首页标识、favicon 共用维护者提供的 `public/nekomi-icon.svg` 原图；通过统一路径函数适配子路径部署。
- `Icon.astro`：本地线性 SVG 操作图标，不承担品牌标识。
- `ColorLab.astro` / `color-lab.ts`：HEX 主色、可选辅助色、快捷色、模式、复制配置、重置和移动端预览跳转。
- `colors.astro` / `color-preview.ts`：同源 iframe 内的独立 MDUI 博客配色示意。
- `quick-start.mjs`：上游 README 的 AST 章节选择，配置参考仍完全来自上游。
- `content.mjs`：构建期 Markdown 渲染、同源标题锚点、相对链接转换。
- `site.ts`：三种主题模式、本地记忆、搜索 / 失败重试 / 键盘选择、复制与移动菜单。
- `global.css`：MD3 语义色、响应式排版、深色、焦点和减少动态支持。

使用原生多页面导航保留浏览器前进 / 后退和滚动恢复，支持浏览器跨文档 View Transitions；未引入客户端路由框架。搜索与截图切换需要 JS，正文、文档导航、FAQ、开始使用链接在关闭 JS 后仍可用。不侵入 MDUI Shadow DOM。默认没有统计、外部字体或第三方 SDK 请求。

## 自定义配色实现

`/demo/#custom-colors` 与真实预设截图分别展示：截图反映实际构建的主题；实验室用于观察颜色角色，保持 Default 示例的布局参数。三种设计预设都允许覆盖六位 HEX 主色与辅助色，预设还可能决定字体、圆角等风格。首页自定义色块仅提供带主色参数的实验室入口，不复制一套编辑器。

预览放在同源 `/preview/colors/` iframe，拥有自己的 document、主题类和 MDUI 色板。父页不调用自己的 setColorScheme 来处理用户颜色，只通过检查 origin 与窗口来源的 postMessage 发送经过校验的配置。MDUI CSS 在生产构建中为共享资产；色板变化由 MDUI 清除旧样式，切换模式不重新生成色板，也不重建 iframe 或文章节点。

算法对齐当前 Nekomi `src/scripts/theme.js`：`setColorScheme(primary, {customColors:[{name:'accent',value:secondary}]})`，再将 accent / on-accent / accent-container / on-accent-container 对应到四个 secondary 角色。辅助色为空时清除这些覆盖，恢复主色推导。模式使用 MDUI setTheme，auto 跟随系统，与官网主题选择独立。未使用截图滤镜或近似调色算法。

复制结果是可直接合并的 JSON，显式 `secondary: ""` 用于关闭旧辅助色覆盖。示例的 `preset: "default"` 也会参与合并；想保留自己站点的 Fresh / Minimal，应保留原有 preset 值。实验室不读取、修改或保存用户的站点文件。

## 验证

```sh
npm run check
npm test
npm run build
python3 tests/check-links.py
# Python Playwright + 已安装的 Chromium，仅测试需要
BROWSER_PATH=/usr/bin/chromium python3 tests/browser.py http://127.0.0.1:4321/
```

配色专项验证会将最新主题源码及其真实 Schema 编译为独立的测试参考程序，不进入生产 dist：

```sh
# 主题 checkout 需要先按其锁文件安装依赖
NEKOMI_SOURCE=/path/to/Nekomi node scripts/build-palette-oracle.mjs
python3 tests/palette-browser.py http://127.0.0.1:4321/
```

它比较 12 个主要色板角色，并让参考程序通过主题真实的 resolveConfig 校验输出；另检查辅助色关闭、无效 HEX、复制、模式隔离、同一 DOM、单份色板样式、触控 / 键盘、尺寸、文档入口与真实截图。结果在 `test-results/round2/`。

`tests/check-links.py` 验证所有本地链接、片段锚点、资源、唯一 ID 与单一 h1；浏览器测试覆盖 320 / 390 / 768 / 1440px、真实图片、12 种截图状态、主题、搜索 / 重试、复制、键盘、移动导航、目录、FAQ、历史及无 JS。结果写入忽略的 `test-results/`。实际交付验证记录见 `VALIDATION.md`，不是上游主题的测试结果。

## 发布前由维护者提供

真实官网源站 / 子路径、可选在线主题 Demo 地址，以及 GitHub 仓库与托管绑定。当前源码可独立构建，并提交到官网仓库的 `main` 分支；尚未执行线上部署。Chrome 浏览器测试不能替代 Safari / Firefox 与真实托管验收。

许可和素材出处见 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) 和 LICENSE。
