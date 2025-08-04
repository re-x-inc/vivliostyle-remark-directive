import fs from 'fs';
import documentProcessor from './document-processor.js';

// サンプルMarkdownを読み込み
const markdown = fs.readFileSync('./sample/sample.md', 'utf-8');

// プロセッサーを作成
const processor = documentProcessor();

// HTMLに変換
const result = await processor.process(markdown);
const html = String(result);

// 完全なHTMLドキュメントとして出力
const fullHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>remark-directive サンプル</title>
  <link rel="stylesheet" href="../theme.css">
</head>
<body>
${html}
</body>
</html>`;

// docsディレクトリに保存
fs.mkdirSync('./docs', { recursive: true });
fs.writeFileSync('./docs/sample.html', fullHtml);

console.log('✅ HTML output saved to docs/sample.html');