import { VFM } from '@vivliostyle/vfm';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkFrontmatter from 'remark-frontmatter';
import { visit } from 'unist-util-visit';

/**
 * VFMプロセッサーのプロトタイプを拡張
 * 注意: この方法はグローバルに影響するため、実際の使用は推奨されません
 * デモンストレーション目的のみ
 */

// VFMが返すProcessorのプロトタイプに新しいメソッドを追加
function extendProcessorPrototype() {
  // 一度だけ拡張を適用
  if (unified().constructor.prototype._vfmExtended) {
    return;
  }
  
  const ProcessorPrototype = unified().constructor.prototype;
  
  // 拡張フラグを設定
  ProcessorPrototype._vfmExtended = true;
  
  // 元のprocessメソッドを保存
  const originalProcess = ProcessorPrototype.process;
  const originalProcessSync = ProcessorPrototype.processSync;
  
  // directive処理を追加するメソッド
  ProcessorPrototype.withDirective = function() {
    this._useDirective = true;
    return this;
  };
  
  // カスタム前処理を追加するメソッド
  ProcessorPrototype.addPreprocessor = function(preprocessor) {
    if (!this._preprocessors) {
      this._preprocessors = [];
    }
    this._preprocessors.push(preprocessor);
    return this;
  };
  
  // processメソッドをオーバーライド
  ProcessorPrototype.process = async function(input) {
    let processedInput = input;
    
    // directive処理が有効な場合
    if (this._useDirective) {
      console.log('📝 Prototype: Processing directives');
      processedInput = await preprocessDirective(input);
    }
    
    // カスタム前処理を実行
    if (this._preprocessors && this._preprocessors.length > 0) {
      for (const preprocessor of this._preprocessors) {
        processedInput = await preprocessor(processedInput);
      }
    }
    
    // 元のprocessメソッドを呼び出し
    return originalProcess.call(this, processedInput);
  };
  
  // processSync メソッドもオーバーライド
  ProcessorPrototype.processSync = function(input) {
    let processedInput = input;
    
    if (this._useDirective) {
      processedInput = preprocessDirectiveSync(input);
    }
    
    if (this._preprocessors && this._preprocessors.length > 0) {
      for (const preprocessor of this._preprocessors) {
        // 同期版の前処理
        processedInput = preprocessor(processedInput);
      }
    }
    
    return originalProcessSync.call(this, processedInput);
  };
}

// directive前処理（非同期）
async function preprocessDirective(input) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkDirective)
    .use(directiveHandler);
  
  const tree = processor.parse(input);
  processor.runSync(tree);
  
  return astToMarkdown(tree);
}

// directive前処理（同期）
function preprocessDirectiveSync(input) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkDirective)
    .use(directiveHandler);
  
  const tree = processor.parse(input);
  processor.runSync(tree);
  
  return astToMarkdown(tree);
}

// directiveハンドラー
function directiveHandler() {
  return (tree) => {
    visit(tree, 'containerDirective', (node) => {
      if (node.name === 'div' && node.attributes?.class) {
        const className = node.attributes.class;
        
        node.type = 'html';
        
        const childrenContent = node.children
          .map(child => {
            if (child.type === 'paragraph' && child.children) {
              return child.children
                .map(c => c.value || '')
                .join('');
            }
            return '';
          })
          .join('\n');
        
        node.value = `<div class="${className}">\n${childrenContent}\n</div>`;
        delete node.children;
        delete node.name;
        delete node.attributes;
      }
    });
  };
}

// ASTをMarkdownに変換
function astToMarkdown(tree) {
  const lines = [];
  
  function processNode(node) {
    switch (node.type) {
      case 'yaml':
        lines.push(`---\n${node.value}\n---`);
        break;
      case 'heading':
        const level = node.depth || 1;
        const content = node.children.map(c => c.value || '').join('');
        lines.push(`${'#'.repeat(level)} ${content}`);
        break;
      case 'paragraph':
        lines.push(node.children.map(c => {
          if (c.type === 'text') return c.value;
          if (c.type === 'html') return c.value;
          return '';
        }).join(''));
        break;
      case 'html':
        lines.push(node.value);
        break;
      default:
        if (node.children) {
          node.children.forEach(processNode);
        }
    }
  }
  
  tree.children.forEach(processNode);
  return lines.join('\n\n');
}

// documentProcessor として使用
export default function documentProcessor(options = {}, metadata = {}) {
  console.log('🎨 VFM Prototype documentProcessor called');
  
  // プロトタイプを拡張（一度だけ）
  extendProcessorPrototype();
  
  // VFMプロセッサーを作成
  const processor = VFM(options, metadata);
  
  // directive処理を有効化
  processor.withDirective();
  
  // カスタム前処理も追加可能
  // processor.addPreprocessor(async (input) => {
  //   console.log('Custom preprocessor running');
  //   return input;
  // });
  
  return {
    process: async (input) => {
      const result = await processor.process(input);
      if (result.contents && !result.value) {
        result.value = result.contents;
      }
      return result;
    },
    processSync: (input) => {
      const result = processor.processSync(input);
      if (result.contents && !result.value) {
        result.value = result.contents;
      }
      return result;
    }
  };
}

// 使用例
export const example = `
// プロトタイプ拡張後の使用例
const processor = VFM(options, metadata);

// 新しいメソッドが使える
processor
  .withDirective()  // directive処理を有効化
  .addPreprocessor(customPreprocessor);  // カスタム前処理を追加

const result = await processor.process(markdown);
`;