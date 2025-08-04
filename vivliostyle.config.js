import documentProcessor from "./document-processor.js";

export default {
  title: "Vivliostyle with Remark Directive",
  author: "Author Name",
  language: "ja",
  size: "A4",
  theme: "theme.css",
  entry: [
    {
      path: "src/sample.md",
      title: "Remark Directive Sample",
    },
  ],
  // HTMLの出力先を明示的に指定
  outputDir: "output-html",
  output: ["dist/sample.pdf"],
  workspaceDir: ".vivliostyle",
  includeAssets: ["theme.css"],
  saveHtml: true,
  copyAsset: {
    includes: ["docs/**/*.{png,jpg,jpeg,svg,gif}"],
  },
  documentProcessor: documentProcessor,
};
