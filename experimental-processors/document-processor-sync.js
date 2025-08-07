import { VFM } from '@vivliostyle/vfm';
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';
import { unified } from 'unified';
import remarkParse from 'remark-parse';

// directiveを処理するハンドラー
function directiveHandler() {
  return (tree) => {
    let count = 0;
    visit(tree, 'containerDirective', (node) => {
      count++;
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

// MDASパースフェーズでremark-directiveを適用するカスタムパーサー
function createDirectiveParser() {
  return unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(directiveHandler);
}

export default function documentProcessor(options = {}, metadata = {}) {
  // まずMarkdownをパースしてdirectiveを処理
  const parser = createDirectiveParser();
  
  // 同期的な処理のみを提供（非同期処理を避ける）
  return {
    processSync: function(input) {
      let markdown = input;
      
      // VFileの場合は文字列に変換
      if (typeof input !== 'string' && input.value) {
        markdown = input.value;
      } else if (typeof input !== 'string' && input.contents) {
        markdown = input.contents;
      }
      
      // Step 1: directiveを含むMarkdownをパース
      const tree = parser.parse(markdown);
      
      // directiveをHTMLに変換
      parser.runSync(tree);
      
      // Step 2: 変換されたMarkdownを文字列に戻す
      let processedMarkdown = '';
      
      function nodeToMarkdown(node, depth = 0) {
        if (node.type === 'html') {
          return node.value;
        } else if (node.type === 'heading') {
          const level = node.depth || 1;
          const prefix = '#'.repeat(level);
          const content = node.children.map(c => nodeToMarkdown(c)).join('');
          return `${prefix} ${content}`;
        } else if (node.type === 'paragraph') {
          return node.children.map(c => nodeToMarkdown(c)).join('');
        } else if (node.type === 'text') {
          return node.value;
        } else if (node.type === 'emphasis') {
          const content = node.children.map(c => nodeToMarkdown(c)).join('');
          return `*${content}*`;
        } else if (node.type === 'strong') {
          const content = node.children.map(c => nodeToMarkdown(c)).join('');
          return `**${content}**`;
        } else if (node.type === 'list') {
          return node.children.map(c => nodeToMarkdown(c)).join('\n');
        } else if (node.type === 'listItem') {
          const content = node.children.map(c => nodeToMarkdown(c)).join('\n');
          return `- ${content}`;
        } else if (node.type === 'code') {
          return '```' + (node.lang || '') + '\n' + node.value + '\n```';
        } else if (node.type === 'inlineCode') {
          return '`' + node.value + '`';
        } else if (node.type === 'blockquote') {
          const content = node.children.map(c => nodeToMarkdown(c)).join('\n');
          return content.split('\n').map(line => `> ${line}`).join('\n');
        } else if (node.type === 'link') {
          const text = node.children.map(c => nodeToMarkdown(c)).join('');
          return `[${text}](${node.url})`;
        } else if (node.type === 'image') {
          return `![${node.alt || ''}](${node.url})`;
        } else if (node.type === 'break') {
          return '  \n';
        }
        
        // その他のノードタイプ
        if (node.children) {
          return node.children.map(c => nodeToMarkdown(c)).join('\n');
        }
        
        return '';
      }
      
      processedMarkdown = tree.children
        .map(node => nodeToMarkdown(node))
        .join('\n\n');
      
      // Step 3: VFMで処理（同期的に）
      const vfm = VFM(options);
      const result = vfm.processSync(processedMarkdown);
      
      // 互換性のため
      if (result.contents && !result.value) {
        result.value = result.contents;
      }
      
      return result;
    },
    
    // processメソッドも同期的に実装
    process: function(input) {
      // Promiseでラップして返す
      return Promise.resolve(this.processSync(input));
    }
  };
}