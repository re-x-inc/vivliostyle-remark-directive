import { VFM } from '@vivliostyle/vfm';

// デバッグ用documentProcessor - 返すオブジェクトの構造を確認
export default function documentProcessor(options = {}, metadata = {}) {
  console.log('🔍 Debug documentProcessor called');
  
  // VFMインスタンスを作成
  const vfm = VFM(options);
  
  // VFMが持つメソッドを確認
  console.log('📋 VFM methods:');
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(vfm));
  console.log(methods);
  
  // VFMインスタンスのプロパティを確認
  console.log('\n📋 VFM properties:');
  console.log(Object.keys(vfm));
  
  // Vivliostyleが期待する形式でオブジェクトを返す
  // VFMをそのまま返さずに、必要なメソッドのみを持つオブジェクトを返す
  const processor = {
    process: async function(file) {
      console.log('🔄 Custom process called');
      console.log('- Input type:', typeof file);
      console.log('- File path:', file?.path);
      console.log('- File history:', file?.history);
      
      // VFMで処理
      const result = await vfm.process(file);
      
      console.log('✅ Process result:');
      console.log('- Result keys:', Object.keys(result));
      console.log('- Has contents:', !!result.contents);
      console.log('- Has value:', !!result.value);
      console.log('- Contents length:', result.contents?.length);
      
      return result;
    },
    
    processSync: function(file) {
      console.log('🔄 Custom processSync called');
      return vfm.processSync(file);
    }
  };
  
  // freezeメソッドがある場合は追加
  if (typeof vfm.freeze === 'function') {
    processor.freeze = function() {
      console.log('🧊 Freeze called');
      return vfm.freeze();
    };
  }
  
  // useメソッドがある場合は追加
  if (typeof vfm.use === 'function') {
    processor.use = function(...args) {
      console.log('🔧 Use called with:', args.length, 'arguments');
      return vfm.use(...args);
    };
  }
  
  console.log('📦 Returning processor with methods:', Object.keys(processor));
  
  return processor;
}