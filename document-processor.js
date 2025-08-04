/**
 * Document Processor for Vivliostyle with remark-directive support
 * 
 * このプロセッサーは、unified ecosystem を使用して Markdown を HTML に変換します。
 * 主要なプラグイン:
 * - remark-parse: Markdown を mdast (Markdown AST) に変換
 * - remark-directive: ::: 記法のディレクティブをサポート
 * - remark-rehype: mdast を hast (HTML AST) に変換
 * - rehype-stringify: hast を HTML 文字列に変換
 */

import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkBreaks from "remark-breaks";
import remarkDirective from "remark-directive";
import remarkFrontmatter from "remark-frontmatter";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";

// VFM figure plugin - Vivliostyle 固有の図表処理
import { hast as figureHast } from "@vivliostyle/vfm/lib/plugins/figure.js";

// デバッグ用プラグイン - 各段階での状態を確認
function debugPlugin(stage) {
  return (tree, file) => {
    try {
      console.log(`\n=== DEBUG: ${stage} ===`);
      
      if (!tree) {
        console.log('Warning: tree is undefined');
        return;
      }
      
      // containerDirectiveノードを探す
      const containerDirectives = [];
      try {
        visit(tree, 'containerDirective', (node) => {
          if (node) {
            containerDirectives.push({
              type: node.type,
              name: node.name,
              attributes: node.attributes,
              data: node.data || 'no data'
            });
          }
        });
      } catch (e) {
        console.log('Error finding containerDirectives:', e.message);
      }
      
      // div要素を探す（HAST段階で）
      const divElements = [];
      try {
        visit(tree, (node) => {
          if (node && node.type === 'element' && node.tagName === 'div') {
            divElements.push({
              tagName: node.tagName,
              properties: node.properties,
              children: node.children?.length || 0
            });
          }
        });
      } catch (e) {
        console.log('Error finding div elements:', e.message);
      }
      
      console.log(`containerDirectives found: ${containerDirectives.length}`);
      containerDirectives.forEach((dir, i) => console.log(`  ${i+1}:`, dir));
      
      console.log(`div elements found: ${divElements.length}`);
      divElements.forEach((div, i) => console.log(`  ${i+1}:`, div));
      
      // 最終段階では文字列出力も表示
      if (stage === 'FINAL' && file) {
        console.log('Final output:');
        console.log(String(file).substring(0, 200) + '...');
      }
    } catch (error) {
      console.log(`Error in debugPlugin (${stage}):`, error.message);
    }
  };
}

/**
 * remark プラグイン: directive を HTML 要素に変換
 * 
 * このプラグインは mdast (Markdown AST) の段階で動作し、
 * remark-directive が生成した containerDirective ノードを
 * remark-rehype が理解できる形式に変換します。
 * 
 * 例: :::div{.note} → <div class="note">
 */
function directiveHandler() {
  return (tree) => {
    try {
      console.log('=== directiveHandler processing ===');
      if (!tree) {
        console.log('Warning: tree is undefined in directiveHandler');
        return;
      }
      
      // mdast ツリーを走査して containerDirective ノードを探す
      visit(tree, 'containerDirective', (node) => {
        if (node && node.name === "div") {
          console.log('Processing containerDirective:', {
            type: node.type,
            name: node.name,
            attributes: node.attributes
          });
          
          // remark-rehype が HTML に変換する際のヒントを設定
          const data = node.data || (node.data = {});
          const className = node.attributes?.class;

          if (className) {
            // hName: HTML要素名
            // hProperties: HTML属性
            data.hName = "div";
            data.hProperties = {
              className: className,
            };
            console.log('Set hName and hProperties for:', className);
          }
        }
      });
    } catch (error) {
      console.log('Error in directiveHandler:', error.message);
    }
  };
}

export default function documentProcessor(options = {}, metadata = {}) {
  console.log('\n🔧 documentProcessor called:', { options, metadata });
  console.log('Stack trace:', new Error().stack.split('\n').slice(1, 5).join('\n'));
  
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
  const baseProcessor = unified()
    .use(remarkParse)              // Step 1: Markdown → mdast
    .use(remarkDirective)          // Step 2: ::: 構文をパース
    .use(directiveHandler)         // Step 3: directive を HTML 用に変換
    .use(remarkBreaks)             // Step 4: 改行処理
    .use(remarkFrontmatter)        // Step 5: フロントマター処理
    .use(remarkRehype, {           // Step 6: mdast → hast 変換
      allowDangerousHtml: true,    // 生 HTML タグを許可
    })
    .use(rehypeRaw)                // Step 7: 生 HTML 処理
    .use(figureHast)               // Step 8: Vivliostyle 用図表処理
    .use(rehypeStringify);         // Step 9: hast → HTML 文字列
  
  // 処理結果をログするラッパー
  const wrappedProcessor = {
    ...baseProcessor,
    process: async function(file) {
      console.log('\n📝 Processor.process() called');
      console.log('Input type:', typeof file);
      console.log('Input preview:', typeof file === 'string' ? file.substring(0, 100) + '...' : 'VFile object');
      
      const result = await baseProcessor.process(file);
      
      console.log('\n📤 Processor.process() result:');
      console.log('Result type:', typeof result);
      console.log('Result.toString():', result.toString().substring(0, 200) + '...');
      console.log('Result.value:', result.value ? result.value.substring(0, 200) + '...' : 'undefined');
      console.log('String(result):', String(result).substring(0, 200) + '...');
      console.log('Contains div.note in toString?', result.toString().includes('<div class="note">'));
      console.log('Contains div.note in value?', result.value?.includes('<div class="note">'));
      console.log('Contains div.note in String()?', String(result).includes('<div class="note">'));
      
      // VFileの内容を確認
      if (result.contents !== undefined) {
        console.log('Result.contents:', typeof result.contents === 'string' ? result.contents.substring(0, 200) + '...' : 'not a string');
      }
      
      // VivliostyleがString(vfile)を使用するため、valueをcontentsにコピー
      if (result.value && result.value !== result.contents) {
        console.log('\n🔄 Copying result.value to result.contents for Vivliostyle compatibility');
        result.contents = result.value;
      }
      
      return result;
    }
  };
  
  console.log('✅ Processor created with result logging');
  return wrappedProcessor;
}
