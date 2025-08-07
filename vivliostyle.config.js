import documentProcessor from "./document-processor.js";
// @ts-check
/** @type {import('@vivliostyle/cli').VivliostyleConfigSchema} */
const vivliostyleConfig = {
  image: "ghcr.io/vivliostyle/cli:9.5.0",

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
  saveHtml: true,
  copyAsset: {
    includes: ["theme.css", "docs/**/*.{png,jpg,jpeg,svg,gif}"],
  },
  documentProcessor: documentProcessor,
};
export default vivliostyleConfig;
