import { VFM } from '@vivliostyle/vfm';
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';

// VFMをカスタマイズする最もクリーンな実装方法
// VFMインスタンスを作成後、追加のプラグインをチェーンする

function directiveHandler() {
  return (tree) => {
    visit(tree, 'containerDirective', (node) => {
      if (node.name === 'div' && node.attributes?.class) {
        const className = node.attributes.class;
        
        // containerDirectiveノードをHTMLノードに変換
        node.type = 'html';
        
        // 子要素を文字列に変換
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

export default function documentProcessor(options = {}, metadata = {}) {
  console.log('🎨 Custom VFM documentProcessor called');
  
  // VFMの基本オプションを設定
  const vfmOptions = {
    ...options,
    hardLineBreaks: options.hardLineBreaks !== false,
    math: options.math !== false,
    // replace オプションも活用可能
    replace: options.replace || []
  };
  
  return {
    process: async function(input) {
      console.log('📝 Processing with custom VFM...');
      
      // VFMプロセッサーを作成
      const processor = VFM(vfmOptions, metadata);
      
      // カスタムプラグインを追加
      // VFMの後にチェーンすることで、VFMの全機能を保持しつつ拡張
      processor
        .use(remarkDirective)
        .use(directiveHandler);
      
      // 処理を実行
      const result = await processor.process(input);
      
      console.log('✅ Custom VFM processing complete');
      console.log('- Has contents:', !!result.contents);
      console.log('- Has value:', !!result.value);
      
      // デバッグ: directive変換を確認
      if (result.contents) {
        console.log('- Contains div.note:', result.contents.includes('<div class="note">'));
        console.log('- Contains div.warning:', result.contents.includes('<div class="warning">'));
      }
      
      // 互換性のための調整
      if (result.contents && !result.value) {
        result.value = result.contents;
      }
      
      return result;
    },
    
    processSync: function(input) {
      console.log('📝 ProcessSync with custom VFM...');
      
      const processor = VFM(vfmOptions, metadata);
      processor
        .use(remarkDirective)
        .use(directiveHandler);
      
      const result = processor.processSync(input);
      
      if (result.contents && !result.value) {
        result.value = result.contents;
      }
      
      return result;
    }
  };
}

// オプション: カスタムVFMクラスとして実装
export class CustomVFM {
  constructor(options = {}, metadata = {}) {
    this.options = options;
    this.metadata = metadata;
  }
  
  createProcessor() {
    const processor = VFM(this.options, this.metadata);
    
    // カスタマイズを追加
    processor
      .use(remarkDirective)
      .use(directiveHandler);
    
    return processor;
  }
  
  async process(input) {
    return this.createProcessor().process(input);
  }
  
  processSync(input) {
    return this.createProcessor().processSync(input);
  }
}