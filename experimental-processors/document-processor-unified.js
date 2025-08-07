import { VFM } from '@vivliostyle/vfm';
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';

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

export default function documentProcessor(options = {}, metadata = {}) {
  console.log('⚡ Unified-optimized documentProcessor called');
  
  // VFMインスタンスを作成
  const vfm = VFM(options);
  
  // VFMのパイプラインにremark-directiveを注入
  // VFMは内部でunifiedプロセッサーを使用しているので、
  // 適切な位置にプラグインを追加する
  
  // VFMの内部構造を調査してプラグインを追加
  // remarkParseの後、remarkRehypeの前に挿入する必要がある
  
  // 方法1: freeze前にuseメソッドで追加（推奨）
  const processor = vfm
    .use(remarkDirective)
    .use(directiveHandler);
  
  // デバッグ用にプラグインの順序を確認
  console.log('📋 Plugin order check:');
  if (processor.attachers) {
    const pluginNames = processor.attachers.map((attacher, i) => {
      const name = attacher[0].name || 'anonymous';
      return `${i}: ${name}`;
    });
    
    // remark-directiveとdirectiveHandlerの位置を確認
    const directiveIndex = pluginNames.findIndex(name => name.includes('remarkDirective'));
    const handlerIndex = pluginNames.findIndex(name => name.includes('directiveHandler'));
    
    console.log(`- remark-directive at index: ${directiveIndex}`);
    console.log(`- directiveHandler at index: ${handlerIndex}`);
    
    // remark2rehypeの位置を確認
    const rehypeIndex = pluginNames.findIndex(name => name.includes('remark2rehype'));
    console.log(`- remark2rehype at index: ${rehypeIndex}`);
    
    if (directiveIndex > rehypeIndex || handlerIndex > rehypeIndex) {
      console.warn('⚠️ Warning: directive plugins added after remark2rehype!');
    }
  }
  
  // オリジナルのprocessメソッドをラップしてデバッグ情報を追加
  const originalProcess = processor.process.bind(processor);
  processor.process = async function(file) {
    console.log('🔄 Processing file with unified pipeline...');
    
    const result = await originalProcess(file);
    
    if (result.contents) {
      console.log('✅ Result:');
      console.log('- Contains div.note:', result.contents.includes('<div class="note">'));
      console.log('- Contains div.warning:', result.contents.includes('<div class="warning">'));
    }
    
    // VFMは contents を使用、Vivliostyleは value も期待する可能性
    if (result.contents && !result.value) {
      result.value = result.contents;
    }
    
    return result;
  };
  
  return processor;
}