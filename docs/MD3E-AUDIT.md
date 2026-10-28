# MD3 Expressive 审计与实施决策

基线：Nekomi-site main `5b2c1b6`；MDUI 2.1.5。保留页面结构、内容、正式 SVG Logo、原生浏览器导航与配色 iframe。

| 控件 / 位置 | 原状 | 决策与原因 |
| --- | --- | --- |
| 首页及其他页 CTA | a.button 自定义颜色 / hover | MDUI Button 的 href + 原生 a 渐进回退，原生 Ripple 与状态层 |
| 搜索 / 菜单 / 截图模式 / 关闭按钮 | 自制 button.icon-button | MDUI Button Icon，SVG 继续使用本地资源 |
| 主导航 / 页脚 / 文档 / 特性行 / 首页颜色入口 | 原生 a | 保留，真实 URL、无 JS、文档浏览与键盘语义优先；只精修状态 |
| 主题偏好 | 原生 select | 保留三项 OS 选择器；统一 MDUI 颜色和焦点，不再增加嵌套弹层 |
| 移动导航 | hidden nav 展开列表 | MDUI modal Navigation Drawer，公开 overlay / panel、事件和关闭属性；保留无 JS details 导航 |
| 返回顶部 | 自制 fixed button | MDUI small FAB，显隐外壳使用可取消动效，滚动 rAF 合并 |
| 文档搜索 | HTML dialog + 原生 search input / a 结果 | MDUI Dialog；输入、结果链接和原有静态索引保留 |
| 预设选择 | 三个自制 aria-pressed button | MDUI Button 组，用公开 tonal / outlined variant 与插槽状态文本管理选择；无 JS 原图链接。经浏览器验证，2.1.5 Segmented Group 的隐藏验证 radio 无公开命名接口，单项 selected 又受保护，因此本轮不强行使用该组件 |
| 配色 HEX / type=color / checkbox / select | 原生表单 | 保留，紧凑、输入模式 / 粘贴 / 验证和系统颜色选择器更合适 |
| 配色快捷色 / 复制 / 重置 | 自制 button | MDUI Button，保留原有校验与 iframe 消息协议 |
| 配色 iframe 的示例按钮 | MDUI Button | 已正确使用，保留；只增加颜色 Effects 过渡 |
| 正文代码复制 | MDUI Button | 保留，不更改复制内容 |
| FAQ / 文档折叠菜单 / 当前页目录 / 同步信息 | 原生 details / summary | 保留，内容在无 JS 下可读；FAQ 用浏览器公开 details-content 渐进动画 |
| 文档搜索入口 | 自制整行 button | 迁移 MDUI outlined Button，保留宽入口布局与原有索引 |
| 图片原图入口 / 文档锚点 / 表格滚动 / 代码 | 原生 a / div / pre | 保留，避免组件侵入长文正文 |

## Token 与动效

原状：global.css 自维护两套 light/dark HEX；MDUI 同时生成另一套色板。Button / header / preset / feature row 各自 0.2s，跨文档 120 / 200ms 淡入淡出；Drawer、FAQ 与截图无空间交接。

实施：语义别名指向 MDUI 公开变量；品牌色使用公开 setColorScheme 生成的静态 CSS 快照，不复制组件内部 CSS。Spatial fast 350ms / default 500ms 与 Effects 120 / 200ms 集中定义，沿用主题参考的 Material Spatial / Effects 曲线。原生组件保留自身交互与 Ripple；只用公开 Part / 变量设置容器尺度。

截图只在图片成功解码后提交，过期请求与动画取消；固定舞台隔离尺寸动画，文档正文不做滚动进入。减少动态时取消 WAAPI 位移 / 缩放及跨文档过渡，保留即时状态。

浏览器复核补充：图标按钮宿主的 aria-label 不会命名 2.1.5 内部按钮，因此用公开默认插槽放入 sr-only 名称；FAB 则使用公开 icon 插槽。Drawer 宽度设在公开 panel Part，保持全屏遮罩。压力检查发现 Chromium 原生跨文档 ViewTransition 在历史 / 减少动态变更时会偶发内部 InvalidStateError；标准事件处理仍不能可靠消除。因此页面进入采用首次绘制的 CSS Effects 淡入，保留原生文档导航、历史与滚动恢复，减少动态时取消进入动画，不增加路由框架或全局错误过滤。

参考：[MDUI 2](https://www.mdui.org/zh-cn/docs/2/)；[Material Expressive motion](https://m3.material.io/blog/m3-expressive-motion-theming)；主题 main `bd3c4de` 的 docs/MOTION.md。MDUI 2.1.5 没有通用 Expressive 弹簧 API，本项目不声称存在。

## 基线硬编码颜色清单

Logo 原图、真实截图、Shiki 双主题高亮及用户配色样例具有独立含义，不作为官网 UI 色板重写。下面是官网样式中的全部 HEX / RGBA 位置；UI 色 / 阴影转为公开角色与 Elevation，预设与自定义色块保留其示例含义。

| 文件与行 | 值 |
| --- | --- |
| `src/components/ColorLab.astro:60` | `#E69DB3` |
| `src/components/ColorLab.astro:95` | `#8C9AC5` |
| `src/components/ColorLab.astro:102` | `#8C9AC5` |
| `src/scripts/site.ts:3` | `#8064b1` |
| `src/styles/global.css:2` | `#fcf9ff` |
| `src/styles/global.css:3` | `#f2edf7` |
| `src/styles/global.css:4` | `#ebe3f4` |
| `src/styles/global.css:5` | `#fff` |
| `src/styles/global.css:6` | `#28232e` |
| `src/styles/global.css:7` | `#655b6d` |
| `src/styles/global.css:8` | `#705098` |
| `src/styles/global.css:9` | `#fff` |
| `src/styles/global.css:10` | `#eaddfa` |
| `src/styles/global.css:11` | `#ded6e5` |
| `src/styles/global.css:12` | `#f4f0f7` |
| `src/styles/global.css:13` | `#5d8275` |
| `src/styles/global.css:14` | `rgba(252, 249, 255, 0.97)` |
| `src/styles/global.css:24` | `#17141c` |
| `src/styles/global.css:25` | `#211c28` |
| `src/styles/global.css:26` | `#302738` |
| `src/styles/global.css:27` | `#211d27` |
| `src/styles/global.css:28` | `#eae0ef` |
| `src/styles/global.css:29` | `#bbb0c4` |
| `src/styles/global.css:30` | `#d2b5fa` |
| `src/styles/global.css:31` | `#39224f` |
| `src/styles/global.css:32` | `#46325e` |
| `src/styles/global.css:33` | `#453c4d` |
| `src/styles/global.css:34` | `#25202d` |
| `src/styles/global.css:35` | `#aacdbd` |
| `src/styles/global.css:36` | `rgba(23, 20, 28, 0.97)` |
| `src/styles/global.css:215` | `#49315b18` |
| `src/styles/global.css:471` | `#9a7cbe` |
| `src/styles/global.css:474` | `#68a393` |
| `src/styles/global.css:477` | `#aaa3b2` |
| `src/styles/global.css:492` | `#28173b0c` |
| `src/styles/global.css:506` | `#b7a9c6` |
| `src/styles/global.css:513` | `#fdf7ff` |
| `src/styles/global.css:663` | `#bfa8dc` |
| `src/styles/global.css:666` | `#a1c5b7` |
| `src/styles/global.css:669` | `#e6bdcf` |
| `src/styles/global.css:672` | `#aac4e1` |
| `src/styles/global.css:675` | `#bcb5c7` |
| `src/styles/global.css:788` | `#28173b18` |
| `src/styles/global.css:1407` | `#160f2a30` |
| `src/styles/global.css:1411` | `#17101f70` |
| `src/styles/color-lab.css:66` | `#b3261e` |
