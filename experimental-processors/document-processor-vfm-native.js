import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkBreaks from 'remark-breaks';
import remarkFrontmatter from 'remark-frontmatter';
import remarkDirective from 'remark-directive';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeFormat from 'rehype-format';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';

// VFMからインポート
import { mdast as attr } from '@vivliostyle/vfm/lib/plugins/attr.js';
import { mdast as code } from '@vivliostyle/vfm/lib/plugins/code.js';
import { mdast as footnotes } from '@vivliostyle/vfm/lib/plugins/footnotes.js';
import { mdast as math } from '@vivliostyle/vfm/lib/plugins/math.js';
import { mdast as ruby } from '@vivliostyle/vfm/lib/plugins/ruby.js';
import { mdast as section } from '@vivliostyle/vfm/lib/plugins/section.js';
import { mdast as slug } from '@vivliostyle/vfm/lib/plugins/slug.js';
import { mdast as toc } from '@vivliostyle/vfm/lib/plugins/toc.js';
import { mdast as doc } from '@vivliostyle/vfm/lib/plugins/document.js';
import { hast as figure } from '@vivliostyle/vfm/lib/plugins/figure.js';
import { hast as hastFootnotes } from '@vivliostyle/vfm/lib/plugins/footnotes.js';
import { hast as hastMath } from '@vivliostyle/vfm/lib/plugins/math.js';
import { handler as rubyHandler } from '@vivliostyle/vfm/lib/plugins/ruby.js';
import { handler as codeHandler } from '@vivliostyle/vfm/lib/plugins/code.js';
import {
  handlerDisplayMath as displayMath,
  handlerInlineMath as inlineMath,
} from '@vivliostyle/vfm/lib/plugins/math.js';

// directiveを処理するハンドラー
function directiveHandler() {
  return (tree) => {
    visit(tree, 'containerDirective', (node) => {
      if (node.name === 'div' && node.attributes?.class) {
        const className = node.attributes.class;
        
        // データを保持しながら、HTML変換用のプロパティを設定
        const data = node.data || (node.data = {});
        data.hName = 'div';
        data.hProperties = {
          className: className
        };
      }
    });
  };
}

/**
 * VFMの内部構造を模倣した、remark-directive対応のプロセッサー
 */
export default function documentProcessor(options = {}, metadata = {}) {
  console.log('🚀 VFM-native documentProcessor called');
  
  const {
    style = undefined,
    partial = false,
    title = undefined,
    language = undefined,
    hardLineBreaks = false,
    disableFormatHtml = false,
    math: enableMath = true,
  } = options;
  
  // メタデータの更新（VFMと同じロジック）
  const updatedMetadata = { ...metadata };
  if (updatedMetadata.title === undefined && title !== undefined) {
    updatedMetadata.title = title;
  }
  if (updatedMetadata.lang === undefined && language !== undefined) {
    updatedMetadata.lang = language;
  }
  if (style) {
    if (updatedMetadata.link === undefined) {
      updatedMetadata.link = [];
    }
    if (typeof style === 'string') {
      updatedMetadata.link.push([
        { name: 'rel', value: 'stylesheet' },
        { name: 'type', value: 'text/css' },
        { name: 'href', value: style },
      ]);
    } else if (Array.isArray(style)) {
      for (const s of style) {
        updatedMetadata.link.push([
          { name: 'rel', value: 'stylesheet' },
          { name: 'type', value: 'text/css' },
          { name: 'href', value: s },
        ]);
      }
    }
  }
  
  // VFMのパイプラインを再現（remark-directive追加）
  const processor = unified()
    // Parse phase (VFM's reviveParse + directive)
    .use(remarkParse, { gfm: true, commonmark: true })
    .use(hardLineBreaks ? remarkBreaks : () => {})
    .use(enableMath ? math : () => {})
    .use(remarkDirective)        // ← ここにremark-directiveを挿入
    .use(directiveHandler)       // ← directiveの処理
    .use(ruby)
    .use(footnotes)
    .use(attr)
    .use(slug)
    .use(section)
    .use(code)
    .use(toc)
    .use(remarkFrontmatter)
    .data('settings', { position: true })
    
    // Transform phase (VFM's reviveRehype)
    .use(remarkRehype, {
      allowDangerousHtml: true,
      handlers: {
        displayMath,
        inlineMath,
        ruby: rubyHandler,
        code: codeHandler,
      },
    })
    .use(rehypeRaw)
    .use(figure)
    .use(hastFootnotes)
    
    // Document wrapping
    .use(!partial ? [doc, updatedMetadata] : () => {})
    
    // Stringify
    .use(rehypeStringify)
    
    // Post-processing
    .use(enableMath ? hastMath : () => {})
    .use(!disableFormatHtml ? rehypeFormat : () => {});
  
  // デバッグ用のラッパー
  const originalProcess = processor.process.bind(processor);
  processor.process = async function(file) {
    console.log('🔄 Processing with VFM-native pipeline...');
    
    const result = await originalProcess(file);
    
    // デバッグ情報
    const outputStr = result.value || result.contents || '';
    console.log('✅ Result:');
    console.log('- Contains DOCTYPE:', outputStr.includes('<!doctype') || outputStr.includes('<!DOCTYPE'));
    console.log('- Contains div.note:', outputStr.includes('<div class="note">'));
    console.log('- Contains div.warning:', outputStr.includes('<div class="warning">'));
    
    // VFMとの互換性確保
    if (result.value && !result.contents) {
      result.contents = result.value;
    } else if (result.contents && !result.value) {
      result.value = result.contents;
    }
    
    return result;
  };
  
  return processor;
}