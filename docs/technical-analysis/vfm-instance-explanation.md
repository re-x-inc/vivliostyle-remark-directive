# 比較表の「VFM機能」列の正確な意味

## VFMインスタンスの利用有無

比較表の「VFM機能」列は、**VFM（@vivliostyle/vfm）のインスタンスを利用しているかどうか**を示しています。

### ✅ = VFMインスタンスを利用

```javascript
import { VFM } from '@vivliostyle/vfm';

export default function documentProcessor(options = {}, metadata = {}) {
  const vfm = VFM(options);  // ← VFMインスタンスを作成
  // ...
}
```

以下のプロセッサーがこれに該当：
- `document-processor-debug.js`
- `document-processor-inject.js`
- `document-processor-minimal.js`
- `document-processor-minimal-process.js`
- `document-processor-pure-function.js`
- `document-processor-sync.js`
- `document-processor-unified.js`
- `document-processor-vfm-compatible.js`
- `document-processor-vfm-early.js`
- **`document-processor-vfm-exact.js`** ✨

### ❌ = VFMインスタンスを利用しない

```javascript
import { unified } from 'unified';
import remarkParse from 'remark-parse';
// VFMをインポートせず、独自のパイプラインを構築

export default function documentProcessor(options = {}, metadata = {}) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkDirective)
    // ...
}
```

以下のプロセッサーがこれに該当：
- `document-processor.js`
- `document-processor-fixed.js`

### 一部 = VFMのプラグインのみを利用

```javascript
// VFMインスタンスは作らないが、VFMのプラグインを個別にインポート
import { mdast as attr } from '@vivliostyle/vfm/lib/plugins/attr.js';
import { mdast as code } from '@vivliostyle/vfm/lib/plugins/code.js';
```

以下のプロセッサーがこれに該当：
- `document-processor-complete.js`
- `document-processor-vfm-native.js`

## なぜVFMインスタンスの利用が重要か

1. **保守性**: VFMの内部実装が変わってもAPIが維持される
2. **互換性**: VFMのすべての機能が自動的に利用可能
3. **簡潔性**: VFMの複雑な処理を再実装する必要がない

## まとめ

`document-processor-vfm-exact.js`は：
- ✅ VFMインスタンスを利用
- ✅ remark-directiveの処理も実現
- ✅ 両方の利点を組み合わせた最適解