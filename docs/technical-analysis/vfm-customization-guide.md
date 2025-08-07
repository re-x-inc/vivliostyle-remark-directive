# VFMカスタマイズ実装ガイド

## 現在のVFMカスタマイズ方法

### 1. VFMの`replace`オプションを活用

```javascript
import { VFM } from '@vivliostyle/vfm';

const customRules = [
  {
    test: /:::note\s+([\s\S]*?):::/g,
    match: ([, content], h) => {
      return h('div', { class: 'note' }, content.trim());
    }
  }
];

const processor = VFM({
  replace: customRules,
  hardLineBreaks: true,
  math: true
});
```

### 2. VFMインスタンスを拡張

```javascript
import { VFM } from '@vivliostyle/vfm';
import remarkDirective from 'remark-directive';

export function createCustomVFM(options = {}) {
  // VFMインスタンスを作成
  const processor = VFM(options);
  
  // 追加のremarkプラグインをチェーン
  processor.use(remarkDirective);
  processor.use(customDirectiveHandler);
  
  return processor;
}
```

### 3. カスタムVFMクラスの実装

```javascript
import { VFM } from '@vivliostyle/vfm';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';

export class CustomVFM {
  constructor(options = {}) {
    this.options = options;
  }
  
  createProcessor() {
    // VFMの基本プロセッサーを取得
    const baseProcessor = VFM(this.options);
    
    // カスタマイズを追加
    return baseProcessor
      .use(remarkDirective)
      .use(this.directiveHandler);
  }
  
  directiveHandler() {
    return (tree) => {
      // directive処理ロジック
    };
  }
  
  process(markdown) {
    return this.createProcessor().process(markdown);
  }
  
  processSync(markdown) {
    return this.createProcessor().processSync(markdown);
  }
}
```

### 4. VFMプラグインとして実装

```javascript
// vfm-remark-directive-plugin.js
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';

export function vfmRemarkDirective() {
  const plugins = [
    remarkDirective,
    directiveToHtml
  ];
  
  return plugins;
}

function directiveToHtml() {
  return (tree) => {
    visit(tree, 'containerDirective', (node) => {
      if (node.name === 'div' && node.attributes?.class) {
        node.type = 'html';
        node.value = `<div class="${node.attributes.class}">
${node.children.map(child => child.value || '').join('\n')}
</div>`;
        delete node.children;
      }
    });
  };
}

// 使用例
const processor = VFM(options);
vfmRemarkDirective().forEach(plugin => {
  processor.use(plugin);
});
```

### 5. Vivliostyle CLIでのdocumentProcessor実装

```javascript
// document-processor-custom-vfm.js
import { VFM } from '@vivliostyle/vfm';
import remarkDirective from 'remark-directive';
import { directiveHandler } from './directive-handler.js';

export default function documentProcessor(options = {}, metadata = {}) {
  // VFMオプションとカスタムオプションをマージ
  const vfmOptions = {
    ...options,
    hardLineBreaks: true,
    math: true
  };
  
  return {
    async process(input) {
      // VFMプロセッサーを作成
      const processor = VFM(vfmOptions, metadata);
      
      // カスタムプラグインを追加
      processor
        .use(remarkDirective)
        .use(directiveHandler);
      
      // 処理を実行
      const result = await processor.process(input);
      
      // 互換性のための調整
      if (result.contents && !result.value) {
        result.value = result.contents;
      }
      
      return result;
    },
    
    processSync(input) {
      const processor = VFM(vfmOptions, metadata);
      processor
        .use(remarkDirective)
        .use(directiveHandler);
      
      return processor.processSync(input);
    }
  };
}
```

## 推奨アプローチ

### 方法1: VFMインスタンスの拡張（シンプル）
既存のVFMインスタンスに追加プラグインをチェーンする方法。最も簡潔で保守しやすい。

### 方法2: カスタムdocumentProcessor（Vivliostyle CLI用）
Vivliostyle CLIとの統合に最適。現在のプロジェクトで採用している方法。

### 方法3: カスタムVFMクラス（高度なカスタマイズ）
より複雑なカスタマイズが必要な場合に使用。

## 今後の拡張可能性

### Hooksインターフェースの活用（将来的な実装）
```javascript
// 現在は未実装だが、将来的に可能になるかもしれない
const processor = VFM({
  hooks: {
    afterParse: [
      {
        test: /pattern/,
        match: (result, h) => { /* ... */ }
      }
    ],
    beforeStringify: [ /* ... */ ],
    afterStringify: [ /* ... */ ]
  }
});
```

### プラグインエコシステムの構築
```javascript
// VFM用のプラグインパッケージ
import vfmDirective from 'vfm-plugin-directive';
import vfmMermaid from 'vfm-plugin-mermaid';

const processor = VFM({
  plugins: [
    vfmDirective(),
    vfmMermaid({ theme: 'dark' })
  ]
});
```

## まとめ

現在のVFMは以下の方法でカスタマイズ可能：
1. `replace`オプションでHTML変換後の置換
2. VFMインスタンスへのプラグイン追加
3. documentProcessorでの完全なカスタマイズ

将来的には`Hooks`インターフェースが実装される可能性があり、より柔軟なカスタマイズが可能になるかもしれません。