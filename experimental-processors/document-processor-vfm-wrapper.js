import { VFM, readMetadata } from '@vivliostyle/vfm';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';

// Custom directive handler that converts containerDirective to HTML
function directiveHandler() {
  return (tree) => {
    visit(tree, 'containerDirective', (node) => {
      if (node.name === 'div' && node.attributes?.class) {
        const className = node.attributes.class;
        
        // Convert containerDirective to HTML node
        node.type = 'html';
        
        // Process children to create HTML content
        const processNode = (node) => {
          if (node.type === 'text') {
            return node.value;
          }
          if (node.type === 'paragraph' && node.children) {
            return '<p>' + node.children.map(processNode).join('') + '</p>';
          }
          if (node.type === 'emphasis' && node.children) {
            return '<em>' + node.children.map(processNode).join('') + '</em>';
          }
          if (node.type === 'strong' && node.children) {
            return '<strong>' + node.children.map(processNode).join('') + '</strong>';
          }
          if (node.type === 'inlineCode') {
            return '<code>' + node.value + '</code>';
          }
          if (node.type === 'code') {
            const lang = node.lang ? ` class="language-${node.lang}"` : '';
            return `<pre><code${lang}>${node.value}</code></pre>`;
          }
          if (node.type === 'link' && node.children) {
            const text = node.children.map(processNode).join('');
            return `<a href="${node.url}">${text}</a>`;
          }
          if (node.type === 'list') {
            const tag = node.ordered ? 'ol' : 'ul';
            const items = node.children.map(item => {
              const content = item.children.map(processNode).join('');
              return '<li>' + content + '</li>';
            }).join('\n');
            return `<${tag}>\n${items}\n</${tag}>`;
          }
          if (node.type === 'listItem' && node.children) {
            return node.children.map(processNode).join('\n');
          }
          if (node.type === 'blockquote' && node.children) {
            return '<blockquote>' + node.children.map(processNode).join('\n') + '</blockquote>';
          }
          if (node.children) {
            return node.children.map(processNode).join('\n');
          }
          return '';
        };
        
        const childrenContent = node.children.map(processNode).join('\n');
        
        node.value = `<div class="${className}">\n${childrenContent}\n</div>`;
        delete node.children;
        delete node.name;
        delete node.attributes;
      }
    });
  };
}

// Pre-processor to handle directives before VFM
async function preprocessDirectives(markdown) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkDirective)
    .use(directiveHandler)
    .use(function() {
      // Custom compiler that outputs markdown with HTML blocks
      this.Compiler = function(tree) {
        const processNode = (node, depth = 0) => {
          switch (node.type) {
            case 'root':
              return node.children.map(n => processNode(n, depth)).join('\n\n');
            
            case 'yaml':
              return `---\n${node.value}\n---`;
            
            case 'html':
              return node.value;
            
            case 'heading':
              const level = node.depth || 1;
              const content = node.children.map(n => processNode(n, depth)).join('');
              return '#'.repeat(level) + ' ' + content;
            
            case 'paragraph':
              return node.children.map(n => processNode(n, depth)).join('');
            
            case 'text':
              return node.value;
            
            case 'emphasis':
              return '*' + node.children.map(n => processNode(n, depth)).join('') + '*';
            
            case 'strong':
              return '**' + node.children.map(n => processNode(n, depth)).join('') + '**';
            
            case 'inlineCode':
              return '`' + node.value + '`';
            
            case 'code':
              const fence = '```';
              return fence + (node.lang || '') + '\n' + node.value + '\n' + fence;
            
            case 'list':
              return node.children.map(n => processNode(n, depth)).join('\n');
            
            case 'listItem':
              const marker = node.ordered ? '1. ' : '- ';
              const itemContent = node.children.map(n => processNode(n, depth + 1)).join('\n');
              return marker + itemContent;
            
            case 'blockquote':
              return node.children
                .map(n => processNode(n, depth))
                .join('\n')
                .split('\n')
                .map(line => '> ' + line)
                .join('\n');
            
            case 'link':
              const text = node.children.map(n => processNode(n, depth)).join('');
              return `[${text}](${node.url})`;
            
            case 'image':
              return `![${node.alt || ''}](${node.url})`;
            
            case 'break':
              return '  \n';
            
            case 'thematicBreak':
              return '---';
            
            default:
              if (node.children) {
                return node.children.map(n => processNode(n, depth)).join('\n');
              }
              return '';
          }
        };
        
        return processNode(tree);
      };
    });
  
  const result = await processor.process(markdown);
  return String(result);
}

/**
 * Document processor that adds remark-directive support to VFM
 * @param {import('@vivliostyle/vfm').StringifyMarkdownOptions} options
 * @param {import('@vivliostyle/vfm').Metadata} metadata
 */
export default function documentProcessor(options = {}, metadata = {}) {
  console.log('🎯 VFM-wrapper documentProcessor initialized');
  
  return {
    process: async function(input) {
      console.log('📝 Processing with directive pre-processor + VFM...');
      
      let markdown = input;
      
      // Handle VFile input
      if (typeof input !== 'string') {
        if (input.value !== undefined) {
          markdown = input.value;
        } else if (input.contents !== undefined) {
          markdown = input.contents;
        }
      }
      
      // Step 1: Pre-process directives
      console.log('🔧 Pre-processing directives...');
      const processedMarkdown = await preprocessDirectives(markdown);
      
      // Debug output
      console.log('📄 Pre-processed markdown preview:');
      console.log(processedMarkdown.substring(0, 300) + '...');
      console.log('- Contains <div class="note">:', processedMarkdown.includes('<div class="note">'));
      console.log('- Contains <div class="warning">:', processedMarkdown.includes('<div class="warning">'));
      
      // Step 2: Process with VFM
      console.log('🏭 Processing with VFM...');
      const vfm = VFM(options, metadata);
      const result = await vfm.process(processedMarkdown);
      
      console.log('✅ Processing complete');
      
      // Ensure compatibility
      if (result.contents && !result.value) {
        result.value = result.contents;
      }
      
      return result;
    },
    
    processSync: function(input) {
      console.log('📝 ProcessSync with directive pre-processor + VFM...');
      
      let markdown = input;
      
      // Handle VFile input
      if (typeof input !== 'string') {
        if (input.value !== undefined) {
          markdown = input.value;
        } else if (input.contents !== undefined) {
          markdown = input.contents;
        }
      }
      
      // For sync version, we'll use a simpler approach
      // Note: This is not ideal as we're using sync inside async, but VFM doesn't expose sync pre-processing
      const processor = unified()
        .use(remarkParse)
        .use(remarkFrontmatter)
        .use(remarkDirective)
        .use(directiveHandler);
      
      const tree = processor.parse(markdown);
      processor.runSync(tree);
      
      // Convert back to markdown manually
      let processedMarkdown = '';
      
      const processNode = (node) => {
        if (node.type === 'root') {
          return node.children.map(processNode).join('\n\n');
        } else if (node.type === 'yaml') {
          return `---\n${node.value}\n---`;
        } else if (node.type === 'html') {
          return node.value;
        } else if (node.type === 'heading') {
          const content = node.children.map(n => n.value || '').join('');
          return '#'.repeat(node.depth) + ' ' + content;
        } else if (node.type === 'paragraph') {
          return node.children.map(n => n.value || '').join('');
        } else if (node.type === 'text') {
          return node.value;
        }
        return '';
      };
      
      processedMarkdown = processNode(tree);
      
      // Process with VFM
      const vfm = VFM(options, metadata);
      const result = vfm.processSync(processedMarkdown);
      
      // Ensure compatibility
      if (result.contents && !result.value) {
        result.value = result.contents;
      }
      
      return result;
    }
  };
}