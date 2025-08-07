import { VFM as originalVFM, readMetadata } from '@vivliostyle/vfm';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkBreaks from 'remark-breaks';
import remarkFrontmatter from 'remark-frontmatter';
import remarkDirective from 'remark-directive';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import rehypeFormat from 'rehype-format';
import { visit } from 'unist-util-visit';

// Import VFM's internal plugins
import { mdast as attrMdast } from '@vivliostyle/vfm/lib/plugins/attr.js';
import { mdast as codeMdast, handler as codeHandler } from '@vivliostyle/vfm/lib/plugins/code.js';
import { mdast as footnotesMdast, hast as footnotesHast } from '@vivliostyle/vfm/lib/plugins/footnotes.js';
import { mdast as mathMdast, hast as mathHast, handlerDisplayMath, handlerInlineMath } from '@vivliostyle/vfm/lib/plugins/math.js';
import { mdast as rubyMdast, handler as rubyHandler } from '@vivliostyle/vfm/lib/plugins/ruby.js';
import { mdast as sectionMdast } from '@vivliostyle/vfm/lib/plugins/section.js';
import { mdast as slugMdast } from '@vivliostyle/vfm/lib/plugins/slug.js';
import { mdast as tocMdast } from '@vivliostyle/vfm/lib/plugins/toc.js';
import { hast as figureHast } from '@vivliostyle/vfm/lib/plugins/figure.js';
import { mdast as documentMdast } from '@vivliostyle/vfm/lib/plugins/document.js';
import { replace } from '@vivliostyle/vfm/lib/plugins/replace.js';

// Custom directive handler for containerDirective
function directiveHandler() {
  return (tree) => {
    visit(tree, 'containerDirective', (node) => {
      if (node.name === 'div' && node.attributes?.class) {
        const className = node.attributes.class;
        
        // Convert containerDirective to HTML node
        node.type = 'html';
        
        // Process children to extract content
        const processChildren = (children) => {
          return children.map(child => {
            if (child.type === 'paragraph' && child.children) {
              return child.children
                .map(c => {
                  if (c.type === 'text') return c.value;
                  if (c.type === 'emphasis' && c.children) {
                    const content = c.children.map(cc => cc.value || '').join('');
                    return `<em>${content}</em>`;
                  }
                  if (c.type === 'strong' && c.children) {
                    const content = c.children.map(cc => cc.value || '').join('');
                    return `<strong>${content}</strong>`;
                  }
                  if (c.type === 'inlineCode') return `<code>${c.value}</code>`;
                  if (c.type === 'link' && c.children) {
                    const text = c.children.map(cc => cc.value || '').join('');
                    return `<a href="${c.url}">${text}</a>`;
                  }
                  return '';
                })
                .join('');
            }
            if (child.type === 'list') {
              const items = child.children.map(item => {
                const content = processChildren(item.children);
                return `<li>${content.join(' ')}</li>`;
              }).join('\n');
              return child.ordered ? `<ol>\n${items}\n</ol>` : `<ul>\n${items}\n</ul>`;
            }
            if (child.type === 'blockquote' && child.children) {
              const content = processChildren(child.children);
              return `<blockquote>${content.join('\n')}</blockquote>`;
            }
            if (child.type === 'code') {
              const lang = child.lang ? ` class="language-${child.lang}"` : '';
              return `<pre><code${lang}>${child.value}</code></pre>`;
            }
            return '';
          }).filter(Boolean);
        };
        
        const childrenContent = processChildren(node.children).join('\n');
        
        node.value = `<div class="${className}">\n${childrenContent}\n</div>`;
        delete node.children;
        delete node.name;
        delete node.attributes;
      }
    });
  };
}

/**
 * Extended VFM processor with remark-directive support
 * @param {import('@vivliostyle/vfm').StringifyMarkdownOptions} options
 * @param {import('@vivliostyle/vfm').Metadata} metadata
 * @returns {import('unified').Processor}
 */
export function VFMWithDirective(options = {}, metadata = {}) {
  const {
    style = undefined,
    partial = false,
    title = undefined,
    language = undefined,
    replace: replaceRules = undefined,
    hardLineBreaks = false,
    disableFormatHtml = false,
    math = true
  } = options;

  // Update metadata with options
  if (metadata.title === undefined && title !== undefined) {
    metadata.title = title;
  }
  if (metadata.lang === undefined && language !== undefined) {
    metadata.lang = language;
  }
  if (style) {
    if (!metadata.link) metadata.link = [];
    const styles = Array.isArray(style) ? style : [style];
    styles.forEach(s => {
      metadata.link.push([
        { name: 'rel', value: 'stylesheet' },
        { name: 'type', value: 'text/css' },
        { name: 'href', value: s }
      ]);
    });
  }

  // Check vfm settings in metadata
  if (metadata.vfm) {
    if (metadata.vfm.math !== undefined) options.math = metadata.vfm.math;
    if (metadata.vfm.partial !== undefined) options.partial = metadata.vfm.partial;
    if (metadata.vfm.hardLineBreaks !== undefined) options.hardLineBreaks = metadata.vfm.hardLineBreaks;
    if (metadata.vfm.disableFormatHtml !== undefined) options.disableFormatHtml = metadata.vfm.disableFormatHtml;
  }

  // Build the processor with VFM plugins + remark-directive
  const processor = unified()
    .use(remarkParse, { gfm: true, commonmark: true })
    .data('settings', { position: true })
    // Add remark-directive early in the pipeline
    .use(remarkDirective)
    .use(directiveHandler)
    // VFM remark plugins
    .use(hardLineBreaks ? remarkBreaks : () => {})
    .use(math ? mathMdast : () => {})
    .use(rubyMdast)
    .use(footnotesMdast)
    .use(attrMdast)
    .use(slugMdast)
    .use(sectionMdast)
    .use(codeMdast)
    .use(tocMdast)
    .use(remarkFrontmatter)
    // Transform to rehype
    .use(remarkRehype, {
      allowDangerousHtml: true,
      handlers: {
        displayMath: handlerDisplayMath,
        inlineMath: handlerInlineMath,
        ruby: rubyHandler,
        code: codeHandler,
      }
    })
    .use(rehypeRaw)
    .use(figureHast)
    .use(footnotesHast);

  if (replaceRules) {
    processor.use(replace, { rules: replaceRules });
  }

  if (!partial) {
    processor.use(documentMdast, metadata);
  }

  processor.use(rehypeStringify);

  if (math) {
    processor.use(mathHast);
  }

  if (!disableFormatHtml) {
    processor.use(rehypeFormat);
  }

  return processor;
}

/**
 * Document processor function for Vivliostyle integration
 * @param {import('@vivliostyle/vfm').StringifyMarkdownOptions} options
 * @param {import('@vivliostyle/vfm').Metadata} metadata
 */
export default function documentProcessor(options = {}, metadata = {}) {
  console.log('🚀 VFM-extended documentProcessor initialized');
  
  return {
    process: async function(input) {
      console.log('📝 Processing with VFM + remark-directive...');
      
      let markdown = input;
      
      // Handle VFile input
      if (typeof input !== 'string') {
        if (input.value !== undefined) {
          markdown = input.value;
        } else if (input.contents !== undefined) {
          markdown = input.contents;
        }
      }
      
      // Read metadata from markdown if not provided
      if (!metadata || Object.keys(metadata).length === 0) {
        metadata = readMetadata(markdown);
      }
      
      // Create extended VFM processor
      const processor = VFMWithDirective(options, metadata);
      
      // Process the markdown
      const result = await processor.process(markdown);
      
      console.log('✅ Processing complete');
      
      // Ensure compatibility
      if (result.contents && !result.value) {
        result.value = result.contents;
      }
      
      return result;
    },
    
    processSync: function(input) {
      console.log('📝 ProcessSync with VFM + remark-directive...');
      
      let markdown = input;
      
      // Handle VFile input
      if (typeof input !== 'string') {
        if (input.value !== undefined) {
          markdown = input.value;
        } else if (input.contents !== undefined) {
          markdown = input.contents;
        }
      }
      
      // Read metadata from markdown if not provided
      if (!metadata || Object.keys(metadata).length === 0) {
        metadata = readMetadata(markdown);
      }
      
      // Create extended VFM processor
      const processor = VFMWithDirective(options, metadata);
      
      // Process the markdown synchronously
      const result = processor.processSync(markdown);
      
      // Ensure compatibility
      if (result.contents && !result.value) {
        result.value = result.contents;
      }
      
      return result;
    }
  };
}