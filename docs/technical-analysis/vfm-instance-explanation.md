# 比較表の「VFM 機能」列の正確な意味

## VFM インスタンスの利用有無

比較表の「VFM 機能」列は、**VFM（@vivliostyle/vfm）のインスタンスを利用しているかどうか**を示しています。

### ✅ = VFM インスタンスを利用

```javascript
import { VFM } from "@vivliostyle/vfm";

export default function documentProcessor(options = {}, metadata = {}) {
  const vfm = VFM(options); // ← VFMインスタンスを作成
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

### ❌ = VFM インスタンスを利用しない

```javascript
import { unified } from "unified";
import remarkParse from "remark-parse";
// VFMをインポートせず、独自のパイプラインを構築

export default function documentProcessor(options = {}, metadata = {}) {
  const processor = unified().use(remarkParse).use(remarkDirective);
  // ...
}
```

以下のプロセッサーがこれに該当：

- `document-processor.js`
- `document-processor-fixed.js`

### 一部 = VFM のプラグインのみを利用

```javascript
// VFMインスタンスは作らないが、VFMのプラグインを個別にインポート
import { mdast as attr } from "@vivliostyle/vfm/lib/plugins/attr.js";
import { mdast as code } from "@vivliostyle/vfm/lib/plugins/code.js";
```

以下のプロセッサーがこれに該当：

- `document-processor-complete.js`
- `document-processor-vfm-native.js`

## なぜ VFM インスタンスの利用が重要か

1. **保守性**: VFM の内部実装が変わっても API が維持される
2. **互換性**: VFM のすべての機能が自動的に利用可能
3. **簡潔性**: VFM の複雑な処理を再実装する必要がない

## まとめ

`document-processor-vfm-exact.js`は：

- ✅ VFM インスタンスを利用
- ✅ remark-directive の処理も実現
- ✅ 両方の利点を組み合わせた最適解
