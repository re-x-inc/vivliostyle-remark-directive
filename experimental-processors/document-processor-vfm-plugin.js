import { VFM } from '@vivliostyle/vfm';
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';

// directiveを処理するremarkプラグイン
function remarkDirectiveHandler() {
  return (tree) => {
    visit(tree, 'containerDirective', (node) => {
      if (node.name === 'div' && node.attributes?.class) {
        const className = node.attributes.class;
        
        // containerDirectiveノードのデータを設定
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
  console.log('🔧 VFM-plugin documentProcessor called');
  
  // VFMのデフォルトオプションを取得
  const vfmOptions = {
    ...options,
    // remarkプラグインを追加
    remarkPlugins: [
      ...(options.remarkPlugins || []),
      remarkDirective,
      remarkDirectiveHandler
    ]
  };
  
  // VFMインスタンスを作成
  const processor = VFM(vfmOptions);
  
  // プロセッサーの情報をログ出力
  console.log('📋 VFM processor configured with:');
  console.log('- remarkDirective plugin');
  console.log('- remarkDirectiveHandler plugin');
  console.log('- Original remarkPlugins count:', (options.remarkPlugins || []).length);
  
  return processor;
}