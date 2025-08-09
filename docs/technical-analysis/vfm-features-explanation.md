# VFM 機能の詳細説明

## VFM (Vivliostyle Flavored Markdown) の主要機能

### 1. 📄 完全な HTML ドキュメント生成

- `<!DOCTYPE html>`宣言
- `<html>`、`<head>`、`<body>`タグの自動生成
- メタデータ（charset、viewport）の自動設定
- CSS ファイルの適切なリンク

### 2. 🏷️ セクション構造の自動生成

```html
<!-- VFMが生成する構造 -->
<section class="level1" aria-labelledby="sample-document">
  <h1 id="sample-document">Sample Document</h1>
  <section class="level2" aria-labelledby="基本的な使い方">
    <h2 id="基本的な使い方">基本的な使い方</h2>
  </section>
</section>
```

### 3. 🔗 見出しへの自動 ID 付与

- `# Sample Document` → `<h1 id="sample-document">Sample Document</h1>`
- URL フラグメント（#sample-document）でジャンプ可能
- 目次生成の基盤

### 4. 🖼️ Figure 要素での画像処理

```markdown
![画像の説明](image.png)
```

↓

```html
<figure>
  <img src="image.png" alt="画像の説明" />
  <figcaption>画像の説明</figcaption>
</figure>
```

### 5. 📝 その他の VFM 特有機能

- **ルビ記法**: `{電子出版|でんししゅっぱん}`
- **脚注サポート**: 文末脚注の自動処理
- **数式サポート**: LaTeX 数式の処理（MathJax/KaTeX）
- **コードのシンタックスハイライト**: Prism による色付け
- **フロントマター処理**: YAML メタデータの解析
- **改行処理**: 日本語組版に適した改行ルール

## 比較表での「VFM 機能」列の意味

| VFM 機能 | 説明                                         |
| -------- | -------------------------------------------- |
| ✅       | VFM の全機能が利用可能                       |
| 一部     | セクション構造や ID 生成など一部機能のみ     |
| ❌       | VFM 特有の機能なし（基本的な HTML 変換のみ） |

## なぜ VFM 機能が重要か

1. **出版品質の HTML**: 印刷用 CSS と組み合わせて美しい PDF を生成
2. **アクセシビリティ**: aria-labelledby などの適切な属性
3. **ナビゲーション**: 自動 ID 生成により目次や相互参照が可能
4. **日本語対応**: 日本語組版に最適化された処理

## document-processor-vfm-exact.js が VFM 機能を維持する仕組み

```javascript
// Step 1: remark-directiveで前処理
// :::div{.note} → <div class="note">...</div>

// Step 2: VFMで完全な処理
const vfm = VFM(options);
const result = await vfm.process(processedMarkdown);
// → VFMの全機能が適用された完全なHTML
```

このアプローチにより、remark-directive の機能を追加しながら、VFM の豊富な機能をすべて利用できます。
