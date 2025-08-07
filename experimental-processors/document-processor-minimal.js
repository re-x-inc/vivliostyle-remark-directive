import { VFM } from '@vivliostyle/vfm';

// 最小限のdocumentProcessor - VFMをそのまま返す
export default function documentProcessor(options = {}, metadata = {}) {
  console.log('🔵 Minimal documentProcessor called');
  console.log('Options:', JSON.stringify(options, null, 2));
  console.log('Metadata:', JSON.stringify(metadata, null, 2));
  
  // VFMをそのまま返す（directive処理なし）
  const vfm = VFM(options);
  
  // processメソッドをラップしてログを追加
  const originalProcess = vfm.process.bind(vfm);
  vfm.process = async function(file) {
    console.log('🔄 Process called');
    console.log('- Input type:', typeof file);
    console.log('- Input constructor:', file?.constructor?.name);
    
    try {
      const result = await originalProcess(file);
      console.log('✅ Process completed successfully');
      console.log('- Result type:', typeof result);
      console.log('- Result has contents:', !!result.contents);
      console.log('- Result has value:', !!result.value);
      
      // VFMは通常contentsを使用
      if (result.contents && !result.value) {
        result.value = result.contents;
      }
      
      return result;
    } catch (error) {
      console.error('❌ Process error:', error);
      throw error;
    }
  };
  
  // processSyncメソッドも同様にラップ
  const originalProcessSync = vfm.processSync.bind(vfm);
  vfm.processSync = function(file) {
    console.log('🔄 ProcessSync called');
    try {
      const result = originalProcessSync(file);
      if (result.contents && !result.value) {
        result.value = result.contents;
      }
      return result;
    } catch (error) {
      console.error('❌ ProcessSync error:', error);
      throw error;
    }
  };
  
  return vfm;
}