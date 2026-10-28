# 素材与第三方依赖

官网原创布局、样式与 TypeScript 使用 MIT。界面操作图标为本官网绘制的线性 SVG，不加载图标字体或外部字体。

## Nekomi 品牌图标

`public/nekomi-icon.svg` 由项目维护者在本次任务中直接提供，并明确用于替换官网标识。文件按原样收录，保留紫色圆角底、白猫与翻页造型、原始尺寸和 SVG 内容；页头、页脚、首页标识与 favicon 共同引用这一文件。官网的明暗模式只调整周边界面，不重新着色、裁剪或加底框。

品牌图标的来源和使用依据为维护者提供的素材及本次官网替换要求；品牌素材与官网自行绘制的操作图标分别记录。

## Nekomi 上游资料

`vendor/nekomi/snapshot.json` 中的文档原文和 `public/screenshots/` 原图来自 https://github.com/kylin930/Nekomi ，提交、分支与查询时间记录在 snapshot 内。上游 MIT 许可保留于 `public/NEKOMI-LICENSE.txt`。

只选用 P3.0 无壁纸首页截图与 P3.1 默认阅读截图。截图由项目真实静态产物生成，来源说明见上游 screenshots/P30.md 与 P31.md；不含原站随机背景、第三方动漫人物或未授权立绘。未加工截图内容，网站只按设备比例展示。后续同步若增加人物或壁纸素材，必须重新审核授权。

## 官网依赖

- Astro 与 @astrojs/markdown-remark：MIT，构建期静态页面与 Markdown / Shiki 高亮。
- MDUI 2.1.5：MIT，原生代码复制按钮与 MD3 色板。Lit（BSD-3-Clause）、Material Color Utilities（Apache-2.0）等传递依赖各自保留许可。完整浏览器依赖图许可通过 `npm run licenses` 生成并随 dist 发布在 THIRD-PARTY-LICENSES.txt。
- TypeScript：Apache-2.0；@astrojs/check 与 @types/node：MIT，仅开发检查。
- 浏览器测试使用本地 Playwright / Chromium，axe-core 仅用于独立检查，没有加入生产依赖或分发到浏览器。

构建工具的传递依赖含其他许可证（如 Sharp/libvips）。不能把整个 npm 依赖树统称为 MIT；重新分发工具或二进制时须遵循各包附带许可。默认静态站没有统计、第三方字体、外部图片和评论 SDK 请求。
