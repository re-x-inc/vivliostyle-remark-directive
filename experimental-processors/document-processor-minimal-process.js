import { VFM } from '@vivliostyle/vfm';

// 最小限のdocumentProcessor - processメソッドのみ実装
export default function documentProcessor(options = {}, metadata = {}) {
  // VFMインスタンスを作成
  const vfm = VFM(options);
  
  // processメソッドのみを持つ最小限のオブジェクトを返す
  return {
    process: vfm.process.bind(vfm)
  };
}