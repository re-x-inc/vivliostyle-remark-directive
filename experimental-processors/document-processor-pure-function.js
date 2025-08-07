import { VFM } from '@vivliostyle/vfm';

// 純粋な関数として実装 - VFMインスタンスを保持しない
export default function documentProcessor(options = {}, metadata = {}) {
  // processメソッドのみを持つオブジェクトを返す
  return {
    process: async function(file) {
      // 毎回新しいVFMインスタンスを作成
      const vfm = VFM(options);
      return await vfm.process(file);
    }
  };
}