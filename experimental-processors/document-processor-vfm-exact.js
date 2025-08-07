import { VFM, readMetadata } from '@vivliostyle/vfm';
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';

// directiveを処理するハンドラー - VFMのMDAST段階で適用
function directiveHandler() {
  return (tree) => {
    let count = 0;
    visit(tree, 'containerDirective', (node) => {
      count++;
      if (node.name === 'div' && node.attributes?.class) {
        const className = node.attributes.class;
        
        // containerDirectiveノードを段落ノードに変換し、
        // その中にHTMLタグを直接埋め込む
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
    
    // if (count > 0) {
    //   console.log(`🎯 Transformed ${count} directives to HTML`);
    // }
  };
}

// MDASパースフェーズでremark-directiveを適用するカスタムパーサー
function createDirectiveParser() {
  return unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkDirective)
    .use(directiveHandler);
}

export default function documentProcessor(options = {}, metadata = {}) {
  // console.log('🎨 VFM-exact documentProcessor called');
  
  // まずMarkdownをパースしてdirectiveを処理
  const parser = createDirectiveParser();
  
  return {
    process: async function(input) {
      console.log('📝 Processing with directive pre-processor...');
      
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
        if (node.type === 'yaml') {
          // frontmatterを保持
          return `---\n${node.value}\n---`;
        } else if (node.type === 'html') {
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
      
      console.log('📄 Processed markdown preview:');
      console.log(processedMarkdown.substring(0, 300) + '...');
      console.log('Contains <div class="note">:', processedMarkdown.includes('<div class="note">'));
      console.log('Contains <div class="warning">:', processedMarkdown.includes('<div class="warning">'));
      
      // Step 3: メタデータを抽出
      const extractedMetadata = readMetadata(processedMarkdown);
      const combinedMetadata = { ...metadata, ...extractedMetadata };
      
      // Step 4: VFMで処理
      const vfm = VFM(options, combinedMetadata);
      const result = await vfm.process(processedMarkdown);
      
      console.log('\n✅ VFM processing complete');
      console.log('- Result has contents:', !!result.contents);
      console.log('- Result has value:', !!result.value);
      
      if (result.contents) {
        console.log('- Contains div.note in output:', result.contents.includes('<div class="note">'));
        console.log('- Contains div.warning in output:', result.contents.includes('<div class="warning">'));
      }
      
      // 互換性のため
      if (result.contents && !result.value) {
        result.value = result.contents;
      }
      
      return result;
    },
    
    processSync: function(input) {
      console.log('📝 ProcessSync with directive pre-processor...');
      
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
      const processedMarkdown = tree.children
        .map(node => nodeToMarkdown(node))
        .join('\n\n');
      
      // Step 3: メタデータを抽出
      const extractedMetadata = readMetadata(processedMarkdown);
      const combinedMetadata = { ...metadata, ...extractedMetadata };
      
      // Step 4: VFMで処理
      const vfm = VFM(options, combinedMetadata);
      const result = vfm.processSync(processedMarkdown);
      
      // 互換性のため
      if (result.contents && !result.value) {
        result.value = result.contents;
      }
      
      return result;
    }
  };
}