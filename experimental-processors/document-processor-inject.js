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
  console.log('💉 Inject-based documentProcessor called');
  
  // VFMインスタンスを作成
  const vfm = VFM(options);
  
  // VFMのattachersを直接操作して、適切な位置にプラグインを挿入
  if (vfm.attachers) {
    console.log('📋 Original plugin order:');
    
    // remark2rehypeの位置を見つける
    let remark2rehypeIndex = -1;
    vfm.attachers.forEach((attacher, i) => {
      const name = attacher[0].name || 'anonymous';
      if (name.includes('remark2rehype') || name.includes('remark-rehype')) {
        remark2rehypeIndex = i;
        console.log(`Found remark2rehype at index ${i}`);
      }
    });
    
    if (remark2rehypeIndex > 0) {
      // remark2rehypeの直前にプラグインを挿入
      console.log(`💉 Injecting plugins before remark2rehype at index ${remark2rehypeIndex}`);
      
      vfm.attachers.splice(
        remark2rehypeIndex, 
        0,
        [remarkDirective, {}],
        [directiveHandler, {}]
      );
      
      console.log('✅ Plugins injected successfully');
    } else {
      console.warn('⚠️ Could not find remark2rehype, using fallback method');
      
      // フォールバック: frontmatterの後に追加
      const frontmatterIndex = vfm.attachers.findIndex(
        attacher => attacher[0].name && attacher[0].name.includes('frontmatter')
      );
      
      if (frontmatterIndex >= 0) {
        vfm.attachers.splice(
          frontmatterIndex + 1,
          0,
          [remarkDirective, {}],
          [directiveHandler, {}]
        );
      }
    }
    
    // 最終的なプラグイン順序を確認
    console.log('\n📋 Final plugin order:');
    vfm.attachers.forEach((attacher, i) => {
      const name = attacher[0].name || attacher[0].toString().substring(0, 20) || 'anonymous';
      if (name.includes('directive') || name.includes('remark2rehype')) {
        console.log(`${i}: ${name}`);
      }
    });
  }
  
  // オリジナルのprocessメソッドをラップ
  const originalProcess = vfm.process.bind(vfm);
  vfm.process = async function(file) {
    console.log('🔄 Processing file...');
    
    const result = await originalProcess(file);
    
    if (result.contents) {
      console.log('✅ Result:');
      console.log('- Contains div.note:', result.contents.includes('<div class="note">'));
      console.log('- Contains div.warning:', result.contents.includes('<div class="warning">'));
      
      // デバッグ: directiveがそのまま残っているか確認
      if (result.contents.includes(':::div')) {
        console.log('⚠️ Warning: Directives not processed!');
      }
    }
    
    // VFMは contents を使用、Vivliostyleは value も期待する可能性
    if (result.contents && !result.value) {
      result.value = result.contents;
    }
    
    return result;
  };
  
  return vfm;
}