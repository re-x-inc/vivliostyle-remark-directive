# VFM 拡張パターンの比較

VFM は関数として実装されているため、直接的なクラス継承はできませんが、以下の拡張パターンが利用可能です。

## 1. ラッパークラスパターン（推奨）

**ファイル**: `document-processor-vfm-wrapper-class.js`

```javascript
export class ExtendedVFM {
  constructor(options = {}, metadata = {}) {
    this.options = options;
    this.metadata = metadata;
  }

  enableDirective() {
    // directive処理を有効化
    return this;
  }

  async process(input) {
    // 前処理 → VFM → 後処理
  }
}
```

### メリット

- ✅ オブジェクト指向的で直感的
- ✅ メソッドチェーンが可能
- ✅ 状態管理が容易
- ✅ 拡張性が高い

### デメリット

- ❌ VFM の元の関数インターフェースと異なる
- ❌ 既存コードの移行が必要

## 2. Proxy パターン

**ファイル**: `document-processor-vfm-proxy.js`

```javascript
const handler = {
  get(target, prop) {
    if (prop === "process") {
      return async function (input) {
        // processメソッドをインターセプト
        const preprocessed = await preprocess(input);
        return target.process(preprocessed);
      };
    }
    return target[prop];
  },
};

return new Proxy(originalProcessor, handler);
```

### メリット

- ✅ VFM の元のインターフェースを保持
- ✅ 透過的な拡張が可能
- ✅ 既存コードとの互換性が高い

### デメリット

- ❌ デバッグが難しい
- ❌ パフォーマンスオーバーヘッド
- ❌ TypeScript の型推論が効きにくい

## 3. プロトタイプ拡張パターン（非推奨）

**ファイル**: `document-processor-vfm-prototype.js`

```javascript
ProcessorPrototype.withDirective = function () {
  this._useDirective = true;
  return this;
};
```

### メリット

- ✅ すべての Processor インスタンスで利用可能
- ✅ メソッドチェーンが自然

### デメリット

- ❌ グローバルに影響する
- ❌ 他のライブラリとの競合リスク
- ❌ 実運用では推奨されない

## 4. 現在採用している前処理パターン

**ファイル**: `document-processor-vfm-exact.js`

```javascript
// Step 1: directive処理
const tree = parser.parse(markdown);
parser.runSync(tree);

// Step 2: Markdownに戻す
const processedMarkdown = astToMarkdown(tree);

// Step 3: VFMで処理
const vfm = VFM(options);
return vfm.process(processedMarkdown);
```

### メリット

- ✅ シンプルで理解しやすい
- ✅ VFM の内部に依存しない
- ✅ 安定性が高い

### デメリット

- ❌ AST → Markdown → AST の変換オーバーヘッド
- ❌ 一部の細かい情報が失われる可能性

## 推奨アプローチ

### 新規プロジェクトの場合

**ラッパークラスパターン**を推奨。オブジェクト指向的で拡張性が高く、保守しやすい。

### 既存プロジェクトへの統合

**Proxy パターン**または**現在の前処理パターン**を推奨。既存の VFM インターフェースとの互換性を保ちながら機能を追加できる。

### 現在のプロジェクトでは

**前処理パターン**（`document-processor-vfm-exact.js`）が最も安定して動作しており、VFM の全機能を活用しながら directive 処理を追加できているため、このアプローチを継続することを推奨。

## まとめ

| パターン         | 互換性 | 拡張性 | 保守性 | パフォーマンス | 推奨度 |
| ---------------- | ------ | ------ | ------ | -------------- | ------ |
| ラッパークラス   | △      | ◎      | ◎      | ○              | ◎      |
| Proxy            | ◎      | ○      | △      | △              | ○      |
| プロトタイプ拡張 | ○      | ○      | ×      | ○              | ×      |
| 前処理パターン   | ○      | ○      | ◎      | △              | ◎      |

各パターンには一長一短がありますが、プロジェクトの要件に応じて適切なパターンを選択することが重要です。
