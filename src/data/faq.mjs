export const faqs = [
  [
    "Nekomi 需要服务器吗？",
    "不需要常驻的博客后端。Node.js 只用于本地开发和构建；构建生成 dist/ 静态文件，可交给静态托管平台。启用第三方评论时，评论服务独立运行。",
    "publishing",
  ],
  [
    "支持 GitHub Pages 吗？",
    "支持。设置 SITE_URL 为源站域名，SITE_BASE 为项目路径（例如 /my-blog/），使用主题提供的手动 Pages 工作流。用户名主页仓库或自定义根域名通常使用 /。不要把子路径重复写进 SITE_URL。",
    "publishing",
  ],
  [
    "如何修改主题色和壁纸？",
    "在 site.config.json 中选择 appearance.preset 或设置 appearance.color。壁纸默认关闭：准备有权使用的 public/ 图片，设置 appearance.wallpaper.enabled 和 light / dark；可单独指定手机来源。配置修改后重新构建，开发环境必要时重启。",
    "configuration-guide",
  ],
  [
    "如何添加文章或独立页面？",
    "文章写在 src/content/posts/*.md，填写 title、date 等 Frontmatter；独立页面写在 src/content/pages/，按页面文档设置元数据和 slug。独立页不会进入文章搜索、分类、归档或 RSS。导航链接只创建入口，不负责生成页面。",
    "pages",
  ],
  [
    "评论是否需要后端？",
    "博客本身无需后端，但动态评论需要独立服务。Waline、Twikoo、Artalk 需要先部署或配置对应后端；Giscus 使用 GitHub Discussions 与其官方服务。Giscus 不提供全站最近评论接口。前端只填写公开连接参数，不放管理凭据。",
    "comments",
  ],
  [
    "如何迁移现有博客？",
    "先备份内容，再把 Markdown 转为 Nekomi 支持的 Frontmatter；检查日期、分类、标签、图片路径和扩展语法。原平台的私有短代码需要逐项转换。尽量保持文件 ID 与既有 URL；路径改变时由托管平台配置重定向。已有评论按原服务保留 commentId 或 commentPath，并验证实际线程。",
    "posts",
  ],
  [
    "如何升级主题并保留个人配置？",
    "先备份配置、文章、独立页面、图片、public 自用资源和 src/custom 适配器，阅读 CHANGELOG。保留上游历史的克隆 / Fork 可审阅后合并 upstream；Template 仓库历史独立，建议在新目录引入新版主题并迁回自己的输入。不要用旧 public 整体覆盖新版 Worker。也可用 NEKOMI_CONFIG、NEKOMI_CONTENT_DIR 与 NEKOMI_PAGES_DIR 分离个人数据。",
    "getting-started",
  ],
  [
    "代码版本 1.0.0 就是正式 Release 吗？",
    "不是。源码版本、Git Tag 和 GitHub Release 是不同状态。官网更新日志列出同步时查询到的状态；最新发布情况请查看主题 GitHub Releases。不要使用尚不存在的标签安装命令。",
    "getting-started",
  ],
];
