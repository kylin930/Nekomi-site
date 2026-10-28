// AST sections ignore fenced code and survive reordering of the upstream README.
// This is selection logic, not a separately maintained copy of theme documentation.
const starts = new Set([
  "开始使用",
  "快速开始",
  "快速上手",
  "quick start",
  "getting started",
]);
const included = new Set([
  "配置你的站点",
  "写第一篇文章",
  "发布、seo 与订阅",
  "部署与发布",
  "部署",
  "发布与部署",
]);
function text(node) {
  return node.value || node.children?.map(text).join("") || "";
}
export function remarkQuickStart() {
  return (tree) => {
    let hasStart = false;
    let current;
    const sections = [];
    const definitions = [];
    for (const node of tree.children) {
      if (node.type === "definition") {
        definitions.push(node);
        continue;
      }
      if (node.type === "heading" && node.depth === 2) {
        const title = text(node).trim().toLowerCase();
        const start = starts.has(title);
        hasStart ||= start;
        current =
          start || included.has(title)
            ? {
                rank: start
                  ? 0
                  : title === "配置你的站点"
                    ? 1
                    : title === "写第一篇文章"
                      ? 2
                      : 3,
                children: [],
              }
            : undefined;
        if (current) sections.push(current);
      }
      current?.children.push(node);
    }
    if (!hasStart)
      throw new Error(
        "Nekomi README has no recognized quick-start section. Review its headings and update selection; refusing to publish the entire README.",
      );
    tree.children = [
      ...sections
        .sort((a, b) => a.rank - b.rank)
        .flatMap((section) => section.children),
      ...definitions,
    ];
  };
}
export function remarkDocumentChrome() {
  return (tree) => {
    let hide = false;
    let removedTitle = false;
    tree.children = tree.children.filter((node) => {
      if (node.type === "heading" && node.depth === 1 && !removedTitle) {
        removedTitle = true;
        return false;
      }
      if (node.type === "heading" && node.depth === 2)
        hide = text(node).trim() === "目录";
      return !hide;
    });
  };
}
