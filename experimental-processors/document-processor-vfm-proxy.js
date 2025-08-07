import { VFM } from '@vivliostyle/vfm';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkFrontmatter from 'remark-frontmatter';
import { visit } from 'unist-util-visit';

/**
 * ProxyパターンでVFMプロセッサーを拡張
 * VFMが返すProcessorオブジェクトをProxyでラップし、
 * processメソッドをインターセプトして前処理を追加
 */
function createExtendedVFMProxy(options = {}, metadata = {}) {
  // 元のVFMプロセッサーを作成
  const originalProcessor = VFM(options, metadata);
  
  // directive前処理を行う関数
  const preprocessWithDirective = async (input) => {
    const preprocessor = unified()
      .use(remarkParse)
      .use(remarkFrontmatter)
      .use(remarkDirective)
      .use(directiveHandler);
    
    const tree = preprocessor.parse(input);
    preprocessor.runSync(tree);
    
    return astToMarkdown(tree);
  };
  
  // Proxyハンドラー
  const handler = {
    get(target, prop) {
      // processメソッドをインターセプト
      if (prop === 'process') {
        return async function(input) {
          console.log('🎨 Proxy: Intercepting process method');
          
          // 前処理: directiveを変換
          const preprocessed = await preprocessWithDirective(input);
          console.log('📝 Proxy: After preprocessing');
          
          // 元のprocessメソッドを呼び出し
          const result = await target.process(preprocessed);
          
          console.log('✅ Proxy: Processing complete');
          
          // 互換性のための調整
          if (result.contents && !result.value) {
            result.value = result.contents;
          }
          
          return result;
        };
      }
      
      // processSync メソッドもインターセプト
      if (prop === 'processSync') {
        return function(input) {
          console.log('🎨 Proxy: Intercepting processSync method');
          
          // 同期的に前処理
          const preprocessor = unified()
            .use(remarkParse)
            .use(remarkFrontmatter)
            .use(remarkDirective)
            .use(directiveHandler);
          
          const tree = preprocessor.parse(input);
          preprocessor.runSync(tree);
          const preprocessed = astToMarkdown(tree);
          
          // 元のprocessSyncメソッドを呼び出し
          const result = target.processSync(preprocessed);
          
          if (result.contents && !result.value) {
            result.value = result.contents;
          }
          
          return result;
        };
      }
      
      // その他のメソッドやプロパティはそのまま返す
      return target[prop];
    }
  };
  
  // ProxyでラップしたProcessorを返す
  return new Proxy(originalProcessor, handler);
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
  console.log('🎨 VFM Proxy documentProcessor called');
  
  // Proxyでラップされたプロセッサーを返す
  const proxyProcessor = createExtendedVFMProxy(options, metadata);
  
  return {
    process: async (input) => proxyProcessor.process(input),
    processSync: (input) => proxyProcessor.processSync(input)
  };
}

// より高度なProxyの使用例
export function createAdvancedVFMProxy(options = {}, metadata = {}) {
  const originalProcessor = VFM(options, metadata);
  
  // 拡張設定
  const extensions = {
    preprocessors: [],
    postprocessors: [],
    methodInterceptors: new Map()
  };
  
  // 拡張API
  const extendedAPI = {
    addPreprocessor(fn) {
      extensions.preprocessors.push(fn);
      return this;
    },
    addPostprocessor(fn) {
      extensions.postprocessors.push(fn);
      return this;
    },
    interceptMethod(methodName, interceptor) {
      extensions.methodInterceptors.set(methodName, interceptor);
      return this;
    }
  };
  
  // Proxyハンドラー
  const handler = {
    get(target, prop) {
      // 拡張APIのメソッド
      if (prop in extendedAPI) {
        return extendedAPI[prop];
      }
      
      // インターセプトされたメソッド
      if (extensions.methodInterceptors.has(prop)) {
        return extensions.methodInterceptors.get(prop)(target[prop].bind(target));
      }
      
      // デフォルト動作
      return target[prop];
    }
  };
  
  return new Proxy(originalProcessor, handler);
}