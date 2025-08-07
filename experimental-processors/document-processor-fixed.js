import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkDirective from 'remark-directive';
import remarkBreaks from 'remark-breaks';
import remarkFrontmatter from 'remark-frontmatter';
import rehypeRaw from 'rehype-raw';
import { visit } from 'unist-util-visit';

/**
 * VFM から figure 関連プラグインのみを抽出
 * 画像を figure 要素でラップする処理を追加
 */
function figureHast() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName === 'img' && parent && parent.type === 'element' && parent.tagName === 'p') {
        parent.tagName = 'figure';
      }
    });
  };
}

// directiveを処理するハンドラー
function directiveHandler() {
  return (tree) => {
    visit(tree, 'containerDirective', (node) => {
      if (node.name === 'div' && node.attributes?.class) {
        const className = node.attributes.class;
        
        // データを保持しながら、HTML変換用のプロパティを設定
        const data = node.data || (node.data = {});
        data.hName = 'div';
        data.hProperties = {
          className: className
        };
      }
    });
  };
}

export default function documentProcessor(options = {}, metadata = {}) {
  /**
   * unified プロセッサーパイプライン
   * 
   * 処理フロー:
   * 1. remarkParse: Markdown テキスト → mdast (Markdown AST)
   * 2. remarkDirective: ::: 記法を containerDirective ノードに変換
   * 3. directiveHandler: containerDirective → HTML 変換のヒントを追加
   * 4. remarkBreaks: 改行を <br> タグに変換
   * 5. remarkFrontmatter: YAML フロントマターを処理
   * 6. remarkRehype: mdast → hast (HTML AST) 変換
   * 7. rehypeRaw: 生の HTML タグを処理
   * 8. figureHast: 画像を figure 要素でラップ
   * 9. rehypeStringify: hast → HTML 文字列
   */
  const processor = unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(directiveHandler)
    .use(remarkBreaks)
    .use(remarkFrontmatter)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(figureHast)
    .use(rehypeStringify, { allowDangerousHtml: true });

  // Return the processor directly - Vivliostyle expects a unified processor instance
  return processor;
}