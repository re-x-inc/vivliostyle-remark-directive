import { VFM } from '@vivliostyle/vfm';

// VFMのreplaceオプションを活用してdirective構文をサポート
// これはVFMの標準機能のみを使用する最もシンプルな方法

export default function documentProcessor(options = {}, metadata = {}) {
  console.log('🎨 VFM Replace documentProcessor called');
  
  // directive構文を処理するための置換ルール
  const directiveRules = [
    {
      // :::div{.note} ... ::: の形式にマッチ
      test: /:::div\{\.(\w+)\}\n([\s\S]*?)\n:::/g,
      match: (result, h) => {
        const className = result[1];
        const content = result[2].trim();
        
        // h関数を使ってHTML要素を生成
        return h('div', { class: className }, content);
      }
    },
    {
      // 単一行の:::div{.class}text:::形式にもマッチ
      test: /:::div\{\.(\w+)\}([^:]+):::/g,
      match: (result, h) => {
        const className = result[1];
        const content = result[2].trim();
        
        return h('div', { class: className }, content);
      }
    }
  ];
  
  // 既存のreplaceルールとマージ
  const replaceRules = [
    ...(options.replace || []),
    ...directiveRules
  ];
  
  // VFMオプションを設定
  const vfmOptions = {
    ...options,
    replace: replaceRules,
    hardLineBreaks: options.hardLineBreaks !== false,
    math: options.math !== false
  };
  
  return {
    process: async function(input) {
      console.log('📝 Processing with VFM replace rules...');
      
      // デバッグ: 入力を確認
      const inputStr = typeof input === 'string' ? input : input.value || input.contents;
      console.log('Input contains :::div:', inputStr.includes(':::div'));
      
      // VFMで処理
      const vfm = VFM(vfmOptions, metadata);
      const result = await vfm.process(input);
      
      console.log('✅ VFM Replace processing complete');
      
      // 互換性のための調整
      if (result.contents && !result.value) {
        result.value = result.contents;
      }
      
      return result;
    },
    
    processSync: function(input) {
      const vfm = VFM(vfmOptions, metadata);
      const result = vfm.processSync(input);
      
      if (result.contents && !result.value) {
        result.value = result.contents;
      }
      
      return result;
    }
  };
}

// 使用例とドキュメント
export const examples = {
  // 基本的な使い方
  basic: `
:::div{.note}
これは注記です。
:::

:::div{.warning}
これは警告です。
:::
  `,
  
  // 単一行の使い方
  inline: `
:::div{.tip}ヒント: これは便利な情報です:::
  `,
  
  // カスタムクラス
  custom: `
:::div{.custom-box}
カスタムスタイルのボックス
:::
  `
};