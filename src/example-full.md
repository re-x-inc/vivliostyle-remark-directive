---
title: Vivliostyle + Remark Directive サンプル
author: Vivliostyle ユーザー
date: 2024-01-15
lang: ja
description: Vivliostyleでremark-directiveを使用した完全なサンプル
keywords: [vivliostyle, vfm, remark-directive, markdown]
---

# Vivliostyle + Remark Directive サンプル

このドキュメントは、VivliostyleとRemark Directiveを組み合わせた機能のデモンストレーションです。

## 基本的なコンテナ要素

### 注記（Note）

:::div{.note}
これは注記です。一般的な補足情報を提供する際に使用します。
:::

### 警告（Warning）

:::div{.warning}
これは警告です。注意が必要な情報を示す際に使用します。
:::

### ヒント（Tip）

:::div{.tip}
これはヒントです。役立つアドバイスや推奨事項を提供する際に使用します。
:::

### 情報（Info）

:::div{.info}
これは情報ボックスです。追加の背景情報や詳細を提供します。
:::

### 注意（Caution）

:::div{.caution}
これは注意事項です。慎重に扱うべき内容を示します。
:::

### 重要（Important）

:::div{.important}
これは重要な情報です。必ず確認すべき内容を強調します。
:::

### 危険（Danger）

:::div{.danger}
これは危険警告です。深刻な問題や損害を引き起こす可能性がある内容を示します。
:::

## VFM機能との組み合わせ

### 数式

インライン数式: $E = mc^2$

ブロック数式:

$$
\frac{\partial f}{\partial x} = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h}
$$

### ルビ

{振り仮名|ふりがな}を使った日本語表現が可能です。

### 脚注

これは脚注[^1]のサンプルです。

[^1]: 脚注の内容はここに記載されます。

### コードブロック

```javascript
// remark-directiveを使用したカスタムコンテナ
function createContainer(className, content) {
  return `<div class="${className}">${content}</div>`;
}
```

### テーブル

| 機能 | サポート状況 | 説明 |
|------|------------|------|
| Directive | ✅ | `:::div{.class}`構文 |
| フロントマター | ✅ | YAMLメタデータ |
| 数式 | ✅ | LaTeX構文 |
| ルビ | ✅ | 日本語ルビ |

### リスト内のコンテナ

1. 最初の項目

   :::div{.note}
   リスト内でもコンテナを使用できます。
   :::

2. 次の項目

   :::div{.tip}
   インデントを適切に設定することが重要です。
   :::

## ネストされたコンテナ

:::div{.info}
外側のコンテナ

:::div{.note}
内側のコンテナもサポートされています。
:::

複数レベルのネストが可能です。
:::

## まとめ

このサンプルでは、以下の機能を紹介しました：

- **remark-directive**による7種類のコンテナ要素
- **VFM**の各種機能（数式、ルビ、脚注など）
- **フロントマター**によるメタデータ設定
- コンテナとVFM機能の組み合わせ

これらの機能を組み合わせることで、表現力豊かなドキュメントを作成できます。