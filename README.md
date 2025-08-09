# Vivliostyle + Remark Directive

Vivliostyleでremark-directiveを使用して、Markdownに独自のコンテナ要素を追加するサンプルプロジェクトです。

## 概要

このプロジェクトは、Vivliostyle CLIの`documentProcessor`機能を使用して、remark-directiveによる`:::div{.class}`構文をサポートします。VFM (Vivliostyle Flavored Markdown)のすべての機能を維持しながら、カスタムコンテナ要素を追加できます。

## 機能

- ✅ **remark-directive構文**: `:::div{.note}`のような構文でカスタムコンテナを作成
- ✅ **VFM完全互換**: フロントマター、数式、ルビ、脚注などVFMの全機能を利用可能
- ✅ **フロントマター対応**: YAMLフロントマターからHTMLメタデータを自動生成
- ✅ **カスタムスタイル**: 各コンテナクラスに対応したCSスタイル定義

## インストール

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/vivliostyle-remark-directive.git
cd vivliostyle-remark-directive

# 依存関係をインストール
npm install
```

## 使い方

### プレビュー

```bash
npm run preview
```

ブラウザが自動的に開き、ライブプレビューが表示されます。

### ビルド

```bash
npm run build
```

`dist/`ディレクトリにPDFが生成されます。

### HTMLのみ生成

```bash
npm run html
```

## Markdown記法

### コンテナ要素

```markdown
:::div{.note}
これは注記です。
:::

:::div{.warning}
これは警告です。
:::

:::div{.tip}
これはヒントです。
:::

:::div{.info}
これは情報です。
:::

:::div{.caution}
これは注意です。
:::

:::div{.important}
これは重要事項です。
:::

:::div{.danger}
これは危険警告です。
:::
```

### フロントマター

```yaml
---
title: ドキュメントタイトル
author: 著者名
date: 2024-01-15
lang: ja
description: ドキュメントの説明
keywords: [vivliostyle, remark, directive]
---
```

## カスタマイズ

### 新しいコンテナクラスの追加

1. `theme.css`に新しいクラスのスタイルを追加:

```css
.custom-box {
  padding: 1em;
  margin: 1em 0;
  border: 2px solid #your-color;
  border-radius: 4px;
  background-color: #your-bg-color;
}

.custom-box::before {
  content: "🎯 ";
  font-weight: bold;
}
```

2. Markdownで使用:

```markdown
:::div{.custom-box}
カスタムボックスの内容
:::
```

### document-processorの仕組み

`document-processor.js`は以下の処理を行います：

1. **前処理**: remark-directiveで`:::`構文を解析し、HTMLに変換
2. **メタデータ抽出**: フロントマターからメタデータを読み取り
3. **VFM処理**: 変換されたMarkdownをVFMで完全なHTMLに変換

## プロジェクト構成

```
vivliostyle-remark-directive/
├── src/
│   └── sample.md          # サンプルMarkdownファイル
├── docs/
│   ├── sample.html        # 生成されたHTMLサンプル
│   └── technical-analysis/ # 技術文書
├── dist/                  # ビルド出力ディレクトリ
├── document-processor.js  # メインのdocument processor
├── theme.css             # スタイルシート
├── vivliostyle.config.js # Vivliostyle設定
└── package.json          # プロジェクト設定
```

## 技術詳細

- **Vivliostyle CLI**: v9.5.0
- **@vivliostyle/vfm**: v2.4.0
- **remark-directive**: v3.0.0
- **unified ecosystem**: v11.0.0

詳細な技術分析は`docs/technical-analysis/`ディレクトリを参照してください。

## ライセンス

MIT License

## 貢献

Issue報告やPull Requestを歓迎します。

## 参考資料

- [Vivliostyle公式サイト](https://vivliostyle.org/)
- [VFMドキュメント](https://vivliostyle.github.io/vfm/)
- [remark-directive](https://github.com/remarkjs/remark-directive)