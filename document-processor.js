import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkBreaks from "remark-breaks";
import remarkDirective from "remark-directive";
import remarkFrontmatter from "remark-frontmatter";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";

// VFM figure plugin
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

// directive変換プラグイン
function directiveHandler() {
  return (tree) => {
    try {
      console.log('=== directiveHandler processing ===');
      if (!tree) {
        console.log('Warning: tree is undefined in directiveHandler');
        return;
      }
      
      visit(tree, 'containerDirective', (node) => {
        if (node && node.name === "div") {
          console.log('Processing containerDirective:', {
            type: node.type,
            name: node.name,
            attributes: node.attributes
          });
          const data = node.data || (node.data = {});
          const className = node.attributes?.class;

          if (className) {
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
  
  // プロセッサーを作成して、処理結果を確認するラッパーを追加
  const baseProcessor = unified()
    .use(remarkParse)
    .use(remarkDirective) // :::note構文サポート
    .use(directiveHandler) // カスタムディレクティブ変換
    .use(remarkBreaks) // 改行を<br>に変換
    .use(remarkFrontmatter) // YAMLフロントマター処理
    .use(remarkRehype, {
      allowDangerousHtml: true, // 生HTML許可
    })
    .use(rehypeRaw) // 生HTML処理
    .use(figureHast) // 画像をfigure要素に変換
    .use(rehypeStringify); // HTML出力
  
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
