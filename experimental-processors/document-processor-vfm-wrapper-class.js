import { VFM } from '@vivliostyle/vfm';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkFrontmatter from 'remark-frontmatter';
import { visit } from 'unist-util-visit';

/**
 * VFMをラップするクラス
 * クラス継承はできないが、委譲パターンで同様の効果を実現
 */
export class ExtendedVFM {
  constructor(options = {}, metadata = {}) {
    this.options = options;
    this.metadata = metadata;
    this.preprocessors = [];
    this.postprocessors = [];
  }
  
  /**
   * 前処理プラグインを追加
   */
  addPreprocessor(plugin) {
    this.preprocessors.push(plugin);
    return this; // メソッドチェーン可能
  }
  
  /**
   * 後処理プラグインを追加
   */
  addPostprocessor(plugin) {
    this.postprocessors.push(plugin);
    return this;
  }
  
  /**
   * directive処理を有効化
   */
  enableDirective() {
    this.addPreprocessor({
      name: 'remark-directive',
      plugins: [
        remarkDirective,
        directiveHandler
      ]
    });
    return this;
  }
  
  /**
   * カスタムreplace ruleを追加
   */
  addReplaceRule(rule) {
    if (!this.options.replace) {
      this.options.replace = [];
    }
    this.options.replace.push(rule);
    return this;
  }
  
  /**
   * 前処理を実行
   */
  async preprocess(input) {
    if (this.preprocessors.length === 0) {
      return input;
    }
    
    // 前処理用のプロセッサーを構築
    const preprocessor = unified()
      .use(remarkParse)
      .use(remarkFrontmatter);
    
    // 各前処理プラグインを追加
    for (const { plugins } of this.preprocessors) {
      for (const plugin of plugins) {
        preprocessor.use(plugin);
      }
    }
    
    // ASTを取得して処理
    const tree = preprocessor.parse(input);
    preprocessor.runSync(tree);
    
    // Markdownに戻す
    return astToMarkdown(tree);
  }
  
  /**
   * VFMプロセッサーを作成
   */
  createProcessor() {
    return VFM(this.options, this.metadata);
  }
  
  /**
   * 処理を実行
   */
  async process(input) {
    console.log('🎨 ExtendedVFM processing...');
    
    // Step 1: 前処理
    let processedInput = input;
    if (this.preprocessors.length > 0) {
      processedInput = await this.preprocess(input);
      console.log('📝 After preprocessing:', processedInput.substring(0, 100) + '...');
    }
    
    // Step 2: VFMで処理
    const processor = this.createProcessor();
    const result = await processor.process(processedInput);
    
    // Step 3: 後処理
    if (this.postprocessors.length > 0) {
      // TODO: 後処理の実装
    }
    
    console.log('✅ ExtendedVFM processing complete');
    
    // 互換性のための調整
    if (result.contents && !result.value) {
      result.value = result.contents;
    }
    
    return result;
  }
  
  /**
   * 同期処理
   */
  processSync(input) {
    // 簡略化のため、非同期版と同じロジック
    const processor = this.createProcessor();
    return processor.processSync(input);
  }
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

// ASTをMarkdownに変換するヘルパー関数
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
      case 'text':
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
  const extendedVFM = new ExtendedVFM(options, metadata);
  
  // directive処理を有効化
  extendedVFM.enableDirective();
  
  // カスタムreplace ruleも追加可能
  // extendedVFM.addReplaceRule({
  //   test: /pattern/,
  //   match: (result, h) => h('span', 'replaced')
  // });
  
  return {
    process: async (input) => extendedVFM.process(input),
    processSync: (input) => extendedVFM.processSync(input)
  };
}

// 使用例
export const example = `
// 基本的な使い方
const vfm = new ExtendedVFM({ hardLineBreaks: true });
vfm.enableDirective();
const result = await vfm.process(markdown);

// メソッドチェーン
const vfm = new ExtendedVFM()
  .enableDirective()
  .addReplaceRule({ test: /foo/, match: () => 'bar' })
  .addPreprocessor({ name: 'custom', plugins: [myPlugin] });
`;